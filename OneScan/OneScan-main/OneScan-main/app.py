from flask import Flask, render_template, jsonify, request, redirect, url_for, flash, send_from_directory
from config import DOCUMENT_TYPES
from models import db, Form
import os
import requests
from datetime import datetime
import mysql.connector
from mysql.connector import Error
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///forms.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize database
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload-document', methods=['POST'])
def upload_document():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No selected file'}), 400

        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'File type not allowed'}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add timestamp to filename to make it unique
            filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            # Get document metadata
            doc_type = request.form.get('docType', 'unknown')
            category = request.form.get('category', 'unknown')

            return jsonify({
                'success': True,
                'message': 'File uploaded successfully',
                'data': {
                    'filename': filename,
                    'docType': doc_type,
                    'category': category,
                    'filepath': filepath
                }
            })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/upload")
def upload():
    return render_template("upload.html")


@app.route("/view-fields")
def view_fields():
    return render_template("view_fields.html")


@app.route("/api/document-types")
def get_document_types():
    return jsonify(DOCUMENT_TYPES)


@app.route("/admin")
def admin_panel():
    forms = Form.query.order_by(Form.created_at.desc()).all()
    return render_template("admin.html", forms=forms)


@app.route("/admin/create-form", methods=["GET", "POST"])
def create_form():
    if request.method == "POST":
        try:
            form_data = request.get_json()

            # Validate required fields
            if not form_data.get("name"):
                return jsonify({"success": False, "error": "Form name is required"})
            if not form_data.get("required_documents"):
                return jsonify(
                    {"success": False, "error": "At least one document is required"}
                )

            new_form = Form(
                name=form_data["name"],
                required_documents=form_data["required_documents"],
            )

            db.session.add(new_form)
            db.session.commit()

            return jsonify(
                {
                    "success": True,
                    "form_id": new_form.id,
                    "message": "Form created successfully",
                }
            )

        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "error": str(e)}), 500

    return render_template("create_form.html")


@app.route("/view_form/<int:form_id>")
def view_form(form_id):
    form = Form.query.get_or_404(form_id)
    wallet_address = request.args.get("wallet")
    user_docs = []

    if wallet_address:
        try:
            # Add timeout to prevent hanging
            response = requests.get(
                f"http://localhost:3000/api/documents/owner/{wallet_address}",
                params={"limit": 20},
                timeout=5,  # 5 seconds timeout
            )
            if response.ok:
                data = response.json()
                if data.get("success"):
                    user_docs = data.get("data", {}).get("transactions", [])
        except requests.ConnectionError:
            flash(
                "Unable to connect to document server. Please ensure it is running.",
                "error",
            )
        except requests.Timeout:
            flash("Request to document server timed out. Please try again.", "error")
        except Exception as e:
            flash(f"Error fetching documents: {str(e)}", "error")
            print(f"Error fetching user docs: {e}")

    return render_template(
        "view_form.html", form=form, wallet_address=wallet_address, user_docs=user_docs
    )


@app.route("/admin/delete-form/<int:form_id>", methods=["POST"])
def delete_form(form_id):
    try:
        form = Form.query.get_or_404(form_id)
        db.session.delete(form)  # Actually delete the form from database
        db.session.commit()
        return jsonify({"success": True, "message": "Form deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/custom-fields")
def custom_fields():
    return render_template("custom_fields.html")


@app.route("/api/export-form-data", methods=["POST"])
def export_form_data():
    try:
        data = request.json
        form_id = data.get("form_id")
        blockchain_data = data.get("blockchain_data")

        # Process the data and return success
        return jsonify({"success": True, "message": "Data exported successfully"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/transfer-data", methods=["POST"])
def transfer_data():
    try:
        data = request.json
        form_data = data.get("formData")
        blockchain_data = data.get("blockchainData")
        wallet_address = data.get("walletAddress")

        # Validate required data
        if not all([form_data, blockchain_data, wallet_address]):
            return jsonify({"success": False, "error": "Missing required data"}), 400

        # Get database configuration from form data
        db_config = form_data.get("database")
        if not db_config:
            return (
                jsonify({"success": False, "error": "Missing database configuration"}),
                400,
            )

        try:
            # Create database connection
            connection = mysql.connector.connect(
                host=db_config["host"],
                port=db_config["port"],
                user="root",  # Using root as default user
                password=db_config["password"],
                database=db_config["database"],
            )

            if connection.is_connected():
                cursor = connection.cursor(dictionary=True)

                # Create a mapping of field names to values
                field_mapping = dict(
                    zip(blockchain_data["fieldNames"], blockchain_data["fieldValues"])
                )

                # Prepare field names and values for SQL query
                field_names = []
                field_values = []

                for field in form_data["fields"]:
                    field_name = field["name"]
                    field_value = field_mapping.get(field_name, "")
                    field_names.append(field_name)
                    field_values.append(field_value)

                # Construct and execute INSERT query
                table_name = db_config["table"]
                placeholders = ", ".join(["%s"] * len(field_names))
                columns = ", ".join(field_names)

                query = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
                cursor.execute(query, field_values)
                connection.commit()

                return jsonify(
                    {
                        "success": True,
                        "message": "Data transferred and stored successfully",
                        "details": {
                            "form_id": form_data["form_id"],
                            "fields_stored": len(field_names),
                            "database": db_config["database"],
                            "table": db_config["table"],
                        },
                    }
                )

        except Error as e:
            return (
                jsonify({"success": False, "error": f"Database error: {str(e)}"}),
                500,
            )
        finally:
            if "connection" in locals() and connection.is_connected():
                cursor.close()
                connection.close()

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/scan")
def scan_qr():
    return render_template("scan.html")


if __name__ == "__main__":
    app.run(debug=True)
