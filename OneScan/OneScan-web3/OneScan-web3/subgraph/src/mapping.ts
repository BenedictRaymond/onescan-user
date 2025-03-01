import { DocumentAdded as DocumentAddedEvent } from "../generated/DocumentStorage/DocumentStorage"
import { DocumentStorage } from "../generated/DocumentStorage/DocumentStorage"
import { Document } from "../generated/schema"

export function handleDocumentAdded(event: DocumentAddedEvent): void {
  let document = new Document(event.params.docId.toHexString())
  document.docId = event.params.docId
  document.name = event.params.name
  document.owner = event.params.owner
  
  let contract = DocumentStorage.bind(event.address)
  let docData = contract.getDocument(event.params.docId)
  
  document.description = docData.value1
  document.docType = docData.value2
  document.category = docData.value3
  document.fileCID = docData.value4
  document.createdAt = docData.value5
  document.exists = true  // Since this is called on document addition, exists will always be true
  
  document.save()
} 