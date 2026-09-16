import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.project import Project, ProjectTask
from app.schemas.project import ProjectCreateRequest, ProjectResponse, TaskResponse
from sqlalchemy.orm.attributes import flag_modified

router = APIRouter(prefix="/projects", tags=["Projects"])


def format_sprints(raw_sprints):
    if not raw_sprints:
        return []
    formatted = []
    for idx, s in enumerate(raw_sprints):
        if isinstance(s, dict):
            formatted.append(s)
        elif isinstance(s, str):
            formatted.append({
                "id": f"sp-{idx + 1}",
                "name": s,
                "startDate": "",
                "endDate": "",
                "status": "Active",
            })
    return formatted


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all projects from PostgreSQL database."""
    projects = db.execute(
        select(Project).order_by(desc(Project.created_at))
    ).scalars().all()

    return [
        ProjectResponse(
            id=str(p.id),
            code=p.code,
            name=p.name,
            client=p.client,
            client_details=p.client_details,
            platform=p.platform,
            project_type=p.project_type,
            description=p.description,
            status=p.status,
            progress=p.progress,
            priority=p.priority,
            start_date=p.start_date,
            end_date=p.end_date,
            duration_days=p.duration_days,
            manager={
                "name": p.manager_name or "Administrator",
                "avatar": p.manager_avatar or "",
                "role": p.manager_role or "Manager",
            },
            assigned_employees=p.assigned_employees or [],
            technologies=p.technologies or [],
            platforms=p.platforms or [],
            sub_portals=p.sub_portals or [],
            modules=p.modules or [],
            sprints=format_sprints(p.sprints),
            work_types=p.work_types or [],
            created_at=p.created_at.isoformat() if p.created_at else None,
        )
        for p in projects
    ]


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new project in PostgreSQL database, along with generated tasks."""
    project_code = payload.code
    if not project_code:
        project_code = f"PRJ-{payload.name[:3].upper()}-{uuid.uuid4().hex[:4].upper()}"

    manager_data = payload.manager or {}

    new_project = Project(
        code=project_code,
        name=payload.name,
        client=payload.client,
        client_details=payload.client_details,
        platform=payload.platform,
        project_type=payload.project_type,
        description=payload.description,
        status=payload.status or "In Progress",
        progress=payload.progress or 0,
        priority=payload.priority or "Medium",
        start_date=payload.start_date,
        end_date=payload.end_date,
        duration_days=payload.duration_days,
        manager_name=manager_data.get("name"),
        manager_role=manager_data.get("role"),
        manager_avatar=manager_data.get("avatar"),
        assigned_employees=payload.assigned_employees or [],
        technologies=payload.technologies or [],
        platforms=payload.platforms or [],
        sub_portals=payload.sub_portals or [],
        modules=payload.modules or [],
        sprints=payload.sprints or [],
        work_types=payload.work_types or getattr(payload, "workTypes", None) or [],
        created_by_id=current_user.id,
    )

    db.add(new_project)
    db.flush()

    # Create associated tasks if passed
    if payload.tasks:
        for t in payload.tasks:
            assignee = t.get("assignee") or {}
            task = ProjectTask(
                code=t.get("code") or f"TSK-{uuid.uuid4().hex[:4].upper()}",
                title=t.get("title", ""),
                project_id=new_project.id,
                project_name=new_project.name,
                module=t.get("module") or None,
                sprint=t.get("sprint") or None,
                work_type=t.get("workType") or t.get("work_type") or None,
                status=t.get("status", "To Do"),
                priority=t.get("priority", "Medium"),
                assignee_name=assignee.get("name"),
                assignee_avatar=assignee.get("avatar"),
                assignee_role=assignee.get("role"),
                due_date=t.get("dueDate") or t.get("due_date"),
                estimated_hours=t.get("estimatedHours") or t.get("estimated_hours", 0),
                logged_hours=t.get("loggedHours") or t.get("logged_hours", 0),
                developer_deadline=t.get("developerDeadline") or t.get("developer_deadline"),
            )
            db.add(task)

    db.commit()
    db.refresh(new_project)

    return ProjectResponse(
        id=str(new_project.id),
        code=new_project.code,
        name=new_project.name,
        client=new_project.client,
        client_details=new_project.client_details,
        platform=new_project.platform,
        project_type=new_project.project_type,
        description=new_project.description,
        status=new_project.status,
        progress=new_project.progress,
        priority=new_project.priority,
        start_date=new_project.start_date,
        end_date=new_project.end_date,
        duration_days=new_project.duration_days,
        manager={
            "name": new_project.manager_name or "Administrator",
            "avatar": new_project.manager_avatar or "",
            "role": new_project.manager_role or "Manager",
        },
        assigned_employees=new_project.assigned_employees or [],
        technologies=new_project.technologies or [],
        platforms=new_project.platforms or [],
        sub_portals=new_project.sub_portals or [],
        modules=new_project.modules or [],
        sprints=format_sprints(new_project.sprints),
        work_types=new_project.work_types or [],
        created_at=new_project.created_at.isoformat() if new_project.created_at else None,
    )


@router.patch("/{project_id}/assign-employee", response_model=ProjectResponse)
def assign_employee_to_project(
    project_id: uuid.UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Persist an employee assigned to a project in PostgreSQL."""
    proj = db.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    employee = payload.get("employee")
    if not employee:
        raise HTTPException(status_code=400, detail="Employee payload is required")

    current_assigned = list(proj.assigned_employees or [])
    emp_id = str(employee.get("id"))
    emp_email = (employee.get("email") or "").strip().lower()

    if not any(str(e.get("id")) == emp_id or (e.get("email") and e.get("email").strip().lower() == emp_email) for e in current_assigned):
        current_assigned.append({
            "id": emp_id,
            "name": employee.get("name"),
            "avatar": employee.get("avatar") or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            "role": employee.get("role") or "EMPLOYEE",
            "email": employee.get("email") or "",
            "phone": employee.get("phone") or "",
        })
        proj.assigned_employees = current_assigned
        db.commit()
        db.refresh(proj)

    return ProjectResponse(
        id=str(proj.id),
        code=proj.code,
        name=proj.name,
        client=proj.client,
        client_details=proj.client_details,
        platform=proj.platform,
        project_type=proj.project_type,
        description=proj.description,
        status=proj.status,
        progress=proj.progress,
        priority=proj.priority,
        start_date=proj.start_date,
        end_date=proj.end_date,
        duration_days=proj.duration_days,
        manager={
            "name": proj.manager_name or "Administrator",
            "avatar": proj.manager_avatar or "",
            "role": proj.manager_role or "Manager",
        },
        assigned_employees=proj.assigned_employees or [],
        technologies=proj.technologies or [],
        platforms=proj.platforms or [],
        sub_portals=proj.sub_portals or [],
        modules=proj.modules or [],
        sprints=format_sprints(proj.sprints),
        work_types=proj.work_types or [],
        created_at=proj.created_at.isoformat() if proj.created_at else None,
    )


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: uuid.UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update project details in PostgreSQL."""
    proj = db.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    if "name" in payload and payload["name"]:
        old_name = proj.name
        new_name = payload["name"]
        proj.name = new_name
        if old_name != new_name:
            tasks = db.execute(
                select(ProjectTask).where(ProjectTask.project_id == proj.id)
            ).scalars().all()
            for t in tasks:
                t.project_name = new_name

    if "client" in payload and payload["client"]:
        proj.client = payload["client"]
    if "platform" in payload:
        proj.platform = payload["platform"]
    if "project_type" in payload:
        proj.project_type = payload["project_type"]
    if "description" in payload:
        proj.description = payload["description"]
    if "status" in payload and payload["status"]:
        proj.status = payload["status"]
    if "progress" in payload and payload["progress"] is not None:
        proj.progress = payload["progress"]
    if "priority" in payload and payload["priority"]:
        proj.priority = payload["priority"]
    if "start_date" in payload:
        proj.start_date = payload["start_date"]
    if "end_date" in payload:
        proj.end_date = payload["end_date"]
    if "duration_days" in payload:
        proj.duration_days = payload["duration_days"]
    if "manager" in payload and isinstance(payload["manager"], dict):
        proj.manager_name = payload["manager"].get("name", proj.manager_name)
        proj.manager_avatar = payload["manager"].get("avatar", proj.manager_avatar)
        proj.manager_role = payload["manager"].get("role", proj.manager_role)
    if "assigned_employees" in payload and isinstance(payload["assigned_employees"], list):
        proj.assigned_employees = payload["assigned_employees"]
    if "technologies" in payload:
        proj.technologies = payload["technologies"]
    if "modules" in payload:
        proj.modules = payload["modules"]
        flag_modified(proj, "modules")
    if "sprints" in payload:
        proj.sprints = payload["sprints"]
        flag_modified(proj, "sprints")
    if "work_types" in payload:
        proj.work_types = payload["work_types"]
        flag_modified(proj, "work_types")
    elif "workTypes" in payload:
        proj.work_types = payload["workTypes"]
        flag_modified(proj, "work_types")

    db.commit()
    db.refresh(proj)

    return ProjectResponse(
        id=str(proj.id),
        code=proj.code,
        name=proj.name,
        client=proj.client,
        client_details=proj.client_details,
        platform=proj.platform,
        project_type=proj.project_type,
        description=proj.description,
        status=proj.status,
        progress=proj.progress,
        priority=proj.priority,
        start_date=proj.start_date,
        end_date=proj.end_date,
        duration_days=proj.duration_days,
        manager={
            "name": proj.manager_name or "Administrator",
            "avatar": proj.manager_avatar or "",
            "role": proj.manager_role or "Manager",
        },
        assigned_employees=proj.assigned_employees or [],
        technologies=proj.technologies or [],
        platforms=proj.platforms or [],
        sub_portals=proj.sub_portals or [],
        modules=proj.modules or [],
        sprints=format_sprints(proj.sprints),
        work_types=proj.work_types or [],
        created_at=proj.created_at.isoformat() if proj.created_at else None,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a project and its tasks from the database."""
    proj = db.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    # Delete tasks first by project_id or project_name
    db.query(ProjectTask).filter(
        (ProjectTask.project_id == project_id) | (ProjectTask.project_name == proj.name)
    ).delete(synchronize_session=False)

    db.delete(proj)
    db.commit()
    return None


@router.get("/tasks/all", response_model=List[TaskResponse])
def list_all_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all project tasks from PostgreSQL."""
    tasks = db.execute(
        select(ProjectTask).order_by(desc(ProjectTask.created_at))
    ).scalars().all()

    return [
        TaskResponse(
            id=str(t.id),
            code=t.code,
            title=t.title,
            project=t.project_name,
            module=t.module,
            sprint=t.sprint,
            work_type=t.work_type,
            status=t.status,
            priority=t.priority,
            assignee={
                "name": t.assignee_name or "",
                "email": t.assignee_email or "",
                "avatar": t.assignee_avatar or "",
                "role": t.assignee_role or "",
            },
            due_date=t.due_date,
            start_date=t.start_date,
            description=t.description,
            daily_logs=t.daily_logs or [],
            task_notifications=t.task_notifications or [],
            estimated_hours=t.estimated_hours,
            logged_hours=t.logged_hours,
            developer_deadline=t.developer_deadline,
            is_escalated=t.is_escalated,
        )
        for t in tasks
    ]


@router.post("/tasks/batch", response_model=List[TaskResponse], status_code=status.HTTP_201_CREATED)
def create_tasks_batch(
    payload: List[dict],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Super Admin or Admin assigns tasks to selected employees in PostgreSQL."""
    created_tasks = []
    for t in payload:
        assignee = t.get("assignee") or {}
        new_task = ProjectTask(
            code=t.get("code") or f"TSK-{uuid.uuid4().hex[:4].upper()}",
            title=t.get("title", ""),
            project_name=t.get("project", ""),
            module=t.get("module") or None,
            sprint=t.get("sprint") or None,
            work_type=t.get("workType") or t.get("work_type") or None,
            status=t.get("status", "To Do"),
            priority=t.get("priority", "Medium"),
            assignee_name=assignee.get("name"),
            assignee_email=assignee.get("email"),
            assignee_avatar=assignee.get("avatar"),
            assignee_role=assignee.get("role"),
            due_date=t.get("dueDate") or t.get("due_date"),
            start_date=t.get("startDate") or t.get("start_date"),
            description=t.get("description"),
            daily_logs=t.get("dailyLogs") or t.get("daily_logs") or [],
            task_notifications=t.get("taskNotifications") or t.get("task_notifications") or [],
            estimated_hours=t.get("estimatedHours") or t.get("estimated_hours", 0),
            logged_hours=t.get("loggedHours") or t.get("logged_hours", 0),
            developer_deadline=t.get("developerDeadline") or t.get("developer_deadline"),
        )
        db.add(new_task)
        created_tasks.append(new_task)

    db.commit()
    for task in created_tasks:
        db.refresh(task)

    return [
        TaskResponse(
            id=str(t.id),
            code=t.code,
            title=t.title,
            project=t.project_name,
            module=t.module,
            sprint=t.sprint,
            work_type=t.work_type,
            status=t.status,
            priority=t.priority,
            assignee={
                "name": t.assignee_name or "",
                "email": t.assignee_email or "",
                "avatar": t.assignee_avatar or "",
                "role": t.assignee_role or "",
            },
            due_date=t.due_date,
            start_date=t.start_date,
            description=t.description,
            daily_logs=t.daily_logs or [],
            task_notifications=t.task_notifications or [],
            estimated_hours=t.estimated_hours,
            logged_hours=t.logged_hours,
            developer_deadline=t.developer_deadline,
            is_escalated=t.is_escalated,
        )
        for t in created_tasks
    ]


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a task from PostgreSQL."""
    try:
        uid = uuid.UUID(task_id)
        task = db.get(ProjectTask, uid)
    except ValueError:
        task = db.execute(select(ProjectTask).where(ProjectTask.code == task_id)).scalars().first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return None


@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task_details(
    task_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update task details in PostgreSQL."""
    try:
        uid = uuid.UUID(task_id)
        task = db.get(ProjectTask, uid)
    except ValueError:
        task = db.execute(select(ProjectTask).where(ProjectTask.code == task_id)).scalars().first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if "title" in payload:
        task.title = payload["title"]
    if "module" in payload:
        task.module = payload["module"]
    if "sprint" in payload:
        task.sprint = payload["sprint"]
    if "work_type" in payload or "workType" in payload:
        task.work_type = payload.get("work_type") or payload.get("workType")
    if "status" in payload:
        task.status = payload["status"]
    if "priority" in payload:
        task.priority = payload["priority"]
    if "due_date" in payload or "dueDate" in payload:
        task.due_date = payload.get("due_date") or payload.get("dueDate")
    if "start_date" in payload or "startDate" in payload:
        task.start_date = payload.get("start_date") or payload.get("startDate")
    if "description" in payload:
        task.description = payload["description"]
    if "daily_logs" in payload or "dailyLogs" in payload:
        task.daily_logs = payload.get("daily_logs") or payload.get("dailyLogs")
    if "task_notifications" in payload or "taskNotifications" in payload:
        task.task_notifications = payload.get("task_notifications") or payload.get("taskNotifications")
    if "estimated_hours" in payload or "estimatedHours" in payload:
        task.estimated_hours = payload.get("estimated_hours") or payload.get("estimatedHours")
    if "logged_hours" in payload or "loggedHours" in payload:
        task.logged_hours = payload.get("logged_hours") or payload.get("loggedHours")
    if "developer_deadline" in payload or "developerDeadline" in payload:
        task.developer_deadline = payload.get("developer_deadline") or payload.get("developerDeadline")
    if "assignee" in payload and isinstance(payload["assignee"], dict):
        task.assignee_name = payload["assignee"].get("name", task.assignee_name)
        task.assignee_email = payload["assignee"].get("email", task.assignee_email)
        task.assignee_avatar = payload["assignee"].get("avatar", task.assignee_avatar)
        task.assignee_role = payload["assignee"].get("role", task.assignee_role)

    db.commit()
    db.refresh(task)

    return TaskResponse(
        id=str(task.id),
        code=task.code,
        title=task.title,
        project=task.project_name,
        module=task.module,
        sprint=task.sprint,
        work_type=task.work_type,
        status=task.status,
        priority=task.priority,
        assignee={
            "name": task.assignee_name or "",
            "email": task.assignee_email or "",
            "avatar": task.assignee_avatar or "",
            "role": task.assignee_role or "",
        },
        due_date=task.due_date,
        start_date=task.start_date,
        description=task.description,
        daily_logs=task.daily_logs or [],
        task_notifications=task.task_notifications or [],
        estimated_hours=task.estimated_hours,
        logged_hours=task.logged_hours,
        developer_deadline=task.developer_deadline,
        is_escalated=task.is_escalated,
    )


@router.patch("/tasks/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update working status of a task in PostgreSQL."""
    try:
        uid = uuid.UUID(task_id)
        task = db.get(ProjectTask, uid)
    except ValueError:
        task = db.execute(select(ProjectTask).where(ProjectTask.code == task_id)).scalars().first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    new_status = payload.get("status")
    if new_status:
        task.status = new_status
        db.commit()
        db.refresh(task)

    return TaskResponse(
        id=str(task.id),
        code=task.code,
        title=task.title,
        project=task.project_name,
        module=task.module,
        sprint=task.sprint,
        work_type=task.work_type,
        status=task.status,
        priority=task.priority,
        assignee={
            "name": task.assignee_name or "",
            "avatar": task.assignee_avatar or "",
            "role": task.assignee_role or "",
        },
        due_date=task.due_date,
        start_date=task.start_date,
        description=task.description,
        daily_logs=task.daily_logs or [],
        task_notifications=task.task_notifications or [],
        estimated_hours=task.estimated_hours,
        logged_hours=task.logged_hours,
        developer_deadline=task.developer_deadline,
        is_escalated=task.is_escalated,
    )


@router.patch("/tasks/{task_id}/log-hours", response_model=TaskResponse)
def log_task_hours(
    task_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Log employee working hours on a task in PostgreSQL."""
    try:
        uid = uuid.UUID(task_id)
        task = db.get(ProjectTask, uid)
    except ValueError:
        task = db.execute(select(ProjectTask).where(ProjectTask.code == task_id)).scalars().first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    additional_hours = payload.get("hours", 0)
    task.logged_hours = (task.logged_hours or 0) + additional_hours
    db.commit()
    db.refresh(task)

    return TaskResponse(
        id=str(task.id),
        code=task.code,
        title=task.title,
        project=task.project_name,
        module=task.module,
        sprint=task.sprint,
        work_type=task.work_type,
        status=task.status,
        priority=task.priority,
        assignee={
            "name": task.assignee_name or "",
            "avatar": task.assignee_avatar or "",
            "role": task.assignee_role or "",
        },
        due_date=task.due_date,
        start_date=task.start_date,
        description=task.description,
        daily_logs=task.daily_logs or [],
        task_notifications=task.task_notifications or [],
        estimated_hours=task.estimated_hours,
        logged_hours=task.logged_hours,
        developer_deadline=task.developer_deadline,
        is_escalated=task.is_escalated,
    )

