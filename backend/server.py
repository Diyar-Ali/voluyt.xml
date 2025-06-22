from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import csv
import io
import json
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="CRM API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class LeadStatus(str, Enum):
    prospect = "prospect"
    qualified = "qualified"
    proposal = "proposal"
    negotiation = "negotiation"
    won = "won"
    lost = "lost"

class InteractionType(str, Enum):
    call = "call"
    email = "email"
    meeting = "meeting"
    note = "note"
    task = "task"

class ProjectStatus(str, Enum):
    planning = "planning"
    in_progress = "in_progress"
    on_hold = "on_hold"
    completed = "completed"
    cancelled = "cancelled"

# Data Models
class Contact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    address: Optional[str] = None
    position: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_contacted: Optional[datetime] = None
    assigned_to: Optional[str] = None

class ContactCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    address: Optional[str] = None
    position: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None

class Lead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contact_id: str
    title: str
    description: Optional[str] = None
    status: LeadStatus = LeadStatus.prospect
    value: Optional[float] = None
    probability: Optional[int] = Field(default=25, ge=0, le=100)
    source: Optional[str] = None
    expected_close_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LeadCreate(BaseModel):
    contact_id: str
    title: str
    description: Optional[str] = None
    status: LeadStatus = LeadStatus.prospect
    value: Optional[float] = None
    probability: Optional[int] = Field(default=25, ge=0, le=100)
    source: Optional[str] = None
    expected_close_date: Optional[datetime] = None
    assigned_to: Optional[str] = None

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contact_id: str
    lead_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.planning
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None
    assigned_to: Optional[str] = None
    team_members: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProjectCreate(BaseModel):
    contact_id: str
    lead_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.planning
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None
    assigned_to: Optional[str] = None
    team_members: List[str] = Field(default_factory=list)

class Interaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contact_id: str
    lead_id: Optional[str] = None
    project_id: Optional[str] = None
    type: InteractionType
    title: str
    description: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)
    employee: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[datetime] = None
    completed: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InteractionCreate(BaseModel):
    contact_id: str
    lead_id: Optional[str] = None
    project_id: Optional[str] = None
    type: InteractionType
    title: str
    description: Optional[str] = None
    date: Optional[datetime] = None
    employee: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[datetime] = None
    completed: bool = True

class Insight(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    title: str
    description: str
    priority: str = "medium"  # low, medium, high
    entity_type: str  # contact, lead, project
    entity_id: str
    action_required: bool = False
    assigned_to: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved: bool = False

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    assigned_to: str
    contact_id: Optional[str] = None
    lead_id: Optional[str] = None
    project_id: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: str = "medium"  # low, medium, high
    status: str = "pending"  # pending, in_progress, completed
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: str
    contact_id: Optional[str] = None
    lead_id: Optional[str] = None
    project_id: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: str = "medium"
    created_by: Optional[str] = None

class Company(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    employees_count: Optional[int] = None
    annual_revenue: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CompanyCreate(BaseModel):
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    employees_count: Optional[int] = None
    annual_revenue: Optional[float] = None

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    type: str = "info"  # info, warning, error, success
    recipient: Optional[str] = None
    read: bool = False
    action_url: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None

# Contact endpoints
@api_router.post("/contacts", response_model=Contact)
async def create_contact(contact: ContactCreate):
    contact_dict = contact.dict()
    contact_obj = Contact(**contact_dict)
    await db.contacts.insert_one(contact_obj.dict())
    return contact_obj

@api_router.get("/contacts", response_model=List[Contact])
async def get_contacts(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000)):
    contacts = await db.contacts.find().skip(skip).limit(limit).to_list(limit)
    return [Contact(**contact) for contact in contacts]

@api_router.get("/contacts/{contact_id}", response_model=Contact)
async def get_contact(contact_id: str):
    contact = await db.contacts.find_one({"id": contact_id})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return Contact(**contact)

@api_router.put("/contacts/{contact_id}", response_model=Contact)
async def update_contact(contact_id: str, contact: ContactCreate):
    existing_contact = await db.contacts.find_one({"id": contact_id})
    if not existing_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    contact_dict = contact.dict()
    contact_dict["updated_at"] = datetime.utcnow()
    await db.contacts.update_one({"id": contact_id}, {"$set": contact_dict})
    
    updated_contact = await db.contacts.find_one({"id": contact_id})
    return Contact(**updated_contact)

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    result = await db.contacts.delete_one({"id": contact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted"}

# Company endpoints
@api_router.post("/companies", response_model=Company)
async def create_company(company: CompanyCreate):
    company_dict = company.dict()
    company_obj = Company(**company_dict)
    await db.companies.insert_one(company_obj.dict())
    return company_obj

@api_router.get("/companies", response_model=List[Company])
async def get_companies(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000)):
    companies = await db.companies.find().skip(skip).limit(limit).to_list(limit)
    return [Company(**company) for company in companies]

@api_router.get("/companies/{company_id}", response_model=Company)
async def get_company(company_id: str):
    company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return Company(**company)

@api_router.put("/companies/{company_id}", response_model=Company)
async def update_company(company_id: str, company: CompanyCreate):
    existing_company = await db.companies.find_one({"id": company_id})
    if not existing_company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company_dict = company.dict()
    company_dict["updated_at"] = datetime.utcnow()
    await db.companies.update_one({"id": company_id}, {"$set": company_dict})
    
    updated_company = await db.companies.find_one({"id": company_id})
    return Company(**updated_company)

@api_router.delete("/companies/{company_id}")
async def delete_company(company_id: str):
    result = await db.companies.delete_one({"id": company_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"message": "Company deleted"}

# Lead endpoints
@api_router.post("/leads", response_model=Lead)
async def create_lead(lead: LeadCreate):
    # Verify contact exists
    contact = await db.contacts.find_one({"id": lead.contact_id})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    lead_dict = lead.dict()
    lead_obj = Lead(**lead_dict)
    await db.leads.insert_one(lead_obj.dict())
    return lead_obj

@api_router.get("/leads", response_model=List[Lead])
async def get_leads(status: Optional[LeadStatus] = None, skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000)):
    query = {}
    if status:
        query["status"] = status
    leads = await db.leads.find(query).skip(skip).limit(limit).to_list(limit)
    return [Lead(**lead) for lead in leads]

@api_router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str):
    lead = await db.leads.find_one({"id": lead_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return Lead(**lead)

@api_router.put("/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, lead: LeadCreate):
    existing_lead = await db.leads.find_one({"id": lead_id})
    if not existing_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead_dict = lead.dict()
    lead_dict["updated_at"] = datetime.utcnow()
    await db.leads.update_one({"id": lead_id}, {"$set": lead_dict})
    
    updated_lead = await db.leads.find_one({"id": lead_id})
    return Lead(**updated_lead)

# Project endpoints
@api_router.post("/projects", response_model=Project)
async def create_project(project: ProjectCreate):
    # Verify contact exists
    contact = await db.contacts.find_one({"id": project.contact_id})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    project_dict = project.dict()
    project_obj = Project(**project_dict)
    await db.projects.insert_one(project_obj.dict())
    return project_obj

@api_router.get("/projects", response_model=List[Project])
async def get_projects(status: Optional[ProjectStatus] = None, skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000)):
    query = {}
    if status:
        query["status"] = status
    projects = await db.projects.find(query).skip(skip).limit(limit).to_list(limit)
    return [Project(**project) for project in projects]

# Interaction endpoints
@api_router.post("/interactions", response_model=Interaction)
async def create_interaction(interaction: InteractionCreate):
    # Verify contact exists
    contact = await db.contacts.find_one({"id": interaction.contact_id})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    interaction_dict = interaction.dict()
    if not interaction_dict.get("date"):
        interaction_dict["date"] = datetime.utcnow()
    
    interaction_obj = Interaction(**interaction_dict)
    await db.interactions.insert_one(interaction_obj.dict())
    
    # Update contact's last_contacted date
    await db.contacts.update_one(
        {"id": interaction.contact_id}, 
        {"$set": {"last_contacted": interaction_obj.date}}
    )
    
    return interaction_obj

@api_router.get("/interactions", response_model=List[Interaction])
async def get_interactions(
    contact_id: Optional[str] = None,
    lead_id: Optional[str] = None,
    project_id: Optional[str] = None,
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=1000)
):
    query = {}
    if contact_id:
        query["contact_id"] = contact_id
    if lead_id:
        query["lead_id"] = lead_id
    if project_id:
        query["project_id"] = project_id
    
    interactions = await db.interactions.find(query).sort("date", -1).skip(skip).limit(limit).to_list(limit)
    return [Interaction(**interaction) for interaction in interactions]

# CSV Import/Export endpoints
@api_router.post("/import/contacts")
async def import_contacts(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    contents = await file.read()
    csv_data = csv.DictReader(io.StringIO(contents.decode('utf-8')))
    
    imported_count = 0
    errors = []
    
    for row_num, row in enumerate(csv_data, start=2):
        try:
            # Map CSV columns to Contact fields
            contact_data = {
                "name": row.get("name", "").strip(),
                "email": row.get("email", "").strip() or None,
                "phone": row.get("phone", "").strip() or None,
                "company": row.get("company", "").strip() or None,
                "industry": row.get("industry", "").strip() or None,
                "address": row.get("address", "").strip() or None,
                "position": row.get("position", "").strip() or None,
                "notes": row.get("notes", "").strip() or None,
                "assigned_to": row.get("assigned_to", "").strip() or None,
            }
            
            if not contact_data["name"]:
                errors.append(f"Row {row_num}: Name is required")
                continue
            
            contact = Contact(**contact_data)
            await db.contacts.insert_one(contact.dict())
            imported_count += 1
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
    
    return {
        "imported_count": imported_count,
        "errors": errors,
        "total_processed": imported_count + len(errors)
    }

@api_router.get("/export/contacts")
async def export_contacts():
    contacts = await db.contacts.find().to_list(10000)
    
    output = io.StringIO()
    fieldnames = ["id", "name", "email", "phone", "company", "industry", "address", "position", "notes", "assigned_to", "created_at", "last_contacted"]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    
    writer.writeheader()
    for contact in contacts:
        # Convert datetime objects to strings
        contact_dict = contact.copy()
        for field in ["created_at", "updated_at", "last_contacted"]:
            if contact_dict.get(field):
                contact_dict[field] = contact_dict[field].isoformat()
        writer.writerow({field: contact_dict.get(field, "") for field in fieldnames})
    
    output.seek(0)
    response = StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = "attachment; filename=contacts.csv"
    return response

# Insights and Analytics
@api_router.get("/insights", response_model=List[Insight])
async def get_insights():
    insights = []
    
    # Find contacts not contacted in 30+ days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    stale_contacts = await db.contacts.find({
        "$or": [
            {"last_contacted": {"$lt": thirty_days_ago}},
            {"last_contacted": None}
        ]
    }).to_list(100)
    
    for contact in stale_contacts:
        insight = Insight(
            type="stale_contact",
            title=f"No recent contact with {contact['name']}",
            description=f"Last contacted: {contact.get('last_contacted', 'Never')}",
            priority="medium",
            entity_type="contact",
            entity_id=contact["id"],
            action_required=True,
            assigned_to=contact.get("assigned_to")
        )
        insights.append(insight)
    
    # Find overdue follow-ups
    overdue_interactions = await db.interactions.find({
        "follow_up_required": True,
        "follow_up_date": {"$lt": datetime.utcnow()},
        "completed": False
    }).to_list(100)
    
    for interaction in overdue_interactions:
        contact = await db.contacts.find_one({"id": interaction["contact_id"]})
        insight = Insight(
            type="overdue_followup",
            title=f"Overdue follow-up with {contact['name'] if contact else 'Unknown'}",
            description=f"Follow-up required since {interaction['follow_up_date']}",
            priority="high",
            entity_type="interaction",
            entity_id=interaction["id"],
            action_required=True,
            assigned_to=interaction.get("employee")
        )
        insights.append(insight)
    
    # Find leads stuck in pipeline
    old_leads = await db.leads.find({
        "status": {"$nin": ["won", "lost"]},
        "created_at": {"$lt": datetime.utcnow() - timedelta(days=60)}
    }).to_list(100)
    
    for lead in old_leads:
        contact = await db.contacts.find_one({"id": lead["contact_id"]})
        insight = Insight(
            type="stale_lead",
            title=f"Lead '{lead['title']}' stale for 60+ days",
            description=f"Contact: {contact['name'] if contact else 'Unknown'}, Status: {lead['status']}",
            priority="medium",
            entity_type="lead",
            entity_id=lead["id"],
            action_required=True,
            assigned_to=lead.get("assigned_to")
        )
        insights.append(insight)
    
    return insights

# Dashboard stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    # Count totals
    total_contacts = await db.contacts.count_documents({})
    total_leads = await db.leads.count_documents({})
    total_projects = await db.projects.count_documents({})
    
    # Lead pipeline stats
    pipeline_stats = {}
    for status in LeadStatus:
        count = await db.leads.count_documents({"status": status})
        pipeline_stats[status] = count
    
    # Recent activity - properly convert to Pydantic models
    recent_interactions_raw = await db.interactions.find().sort("date", -1).limit(5).to_list(5)
    recent_interactions = []
    for interaction in recent_interactions_raw:
        try:
            interaction_obj = Interaction(**interaction)
            recent_interactions.append(interaction_obj.dict())
        except Exception as e:
            logger.warning(f"Error converting interaction to model: {e}")
            continue
    
    # Insights count
    insights = await get_insights()
    insights_count = len(insights)
    high_priority_insights = len([i for i in insights if i.priority == "high"])
    
    return {
        "totals": {
            "contacts": total_contacts,
            "leads": total_leads,
            "projects": total_projects
        },
        "pipeline": pipeline_stats,
        "recent_activity": recent_interactions,
        "insights": {
            "total": insights_count,
            "high_priority": high_priority_insights
        }
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()