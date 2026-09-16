from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class ProjectCreateRequest(BaseModel):
    name: str
    code: Optional[str] = None
    client: str
    client_details: Optional[Dict[str, Any]] = None
    platform: Optional[str] = None
    project_type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "In Progress"
    progress: Optional[int] = 0
    priority: Optional[str] = "Medium"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration_days: Optional[int] = None
    manager: Optional[Dict[str, Any]] = None
    assigned_employees: Optional[List[Dict[str, Any]]] = None
    technologies: Optional[List[str]] = None
    platforms: Optional[List[str]] = None
    sub_portals: Optional[List[str]] = None
    modules: Optional[List[str]] = None
    sprints: Optional[List[Any]] = None
    work_types: Optional[List[str]] = None
    tasks: Optional[List[Dict[str, Any]]] = None


class ProjectResponse(BaseModel):
    id: str
    code: str
    name: str
    client: str
    client_details: Optional[Dict[str, Any]] = None
    platform: Optional[str] = None
    project_type: Optional[str] = None
    description: Optional[str] = None
    status: str
    progress: int
    priority: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration_days: Optional[int] = None
    manager: Optional[Dict[str, Any]] = None
    assigned_employees: Optional[List[Dict[str, Any]]] = None
    technologies: Optional[List[str]] = None
    platforms: Optional[List[str]] = None
    sub_portals: Optional[List[str]] = None
    modules: Optional[List[str]] = None
    sprints: Optional[List[Any]] = None
    work_types: Optional[List[str]] = None
    created_at: Optional[str] = None


class TaskResponse(BaseModel):
    id: str
    code: str
    title: str
    project: Optional[str] = None
    module: Optional[str] = None
    sprint: Optional[str] = None
    work_type: Optional[str] = None
    status: str
    priority: str
    assignee: Optional[Dict[str, Any]] = None
    due_date: Optional[str] = None
    start_date: Optional[str] = None
    description: Optional[str] = None
    daily_logs: Optional[List[Dict[str, Any]]] = None
    task_notifications: Optional[List[Dict[str, Any]]] = None
    estimated_hours: Optional[int] = 0
    logged_hours: Optional[int] = 0
    developer_deadline: Optional[str] = None
    is_escalated: Optional[bool] = False
