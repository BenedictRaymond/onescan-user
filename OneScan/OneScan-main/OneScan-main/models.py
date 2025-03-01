from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Form(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    organization = db.Column(db.String(100), default="YES BANK")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    required_documents = db.Column(db.JSON, nullable=False)  # Store as [{category, docType, displayName}]
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'organization': self.organization,
            'created_at': self.created_at.isoformat(),
            'required_documents': self.required_documents,
            'is_active': self.is_active
        } 