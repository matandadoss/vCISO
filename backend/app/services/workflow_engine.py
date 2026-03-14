import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.workflows import WorkflowInstance, WorkflowTask, WorkflowStatus, TaskStatus
from app.models.domain import WorkflowName
from typing import Dict, Any

class WorkflowEngine:
    """
    A state machine engine that handles transitioning workflow instances
    through predefined states based on their workflow type.
    """
    
    # Define valid transitions for each workflow type
    # Mapping: workflow_name -> current_step -> next_step
    WORKFLOW_DEFINITIONS = {
        WorkflowName.supply_chain: {
            "inventory": "tiering",
            "tiering": "assessment",
            "assessment": "monitoring",
            "monitoring": "remediation",
            "remediation": "completed"
        }
        # Other workflows will be defined here (e.g., threat, vulnerability)
    }

    @staticmethod
    async def start_workflow(
        db: AsyncSession, 
        org_id: str, 
        workflow_name: WorkflowName, 
        entity_id: str, 
        entity_type: str,
        initial_step: str,
        initial_data: Dict[str, Any] = None
    ) -> WorkflowInstance:
        """Initializes a new workflow instance."""
        
        try:
            org_uuid = uuid.UUID(org_id)
        except ValueError:
            org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
            
        instance = WorkflowInstance(
            org_id=org_uuid,
            workflow_name=workflow_name,
            entity_id=entity_id,
            entity_type=entity_type,
            status=WorkflowStatus.active,
            current_step=initial_step,
            state_data=initial_data or {}
        )
        
        db.add(instance)
        await db.commit()
        await db.refresh(instance)
        
        # Create the initial pending task for this step
        await WorkflowEngine._create_task(db, instance, "initialization")
        
        return instance

    @staticmethod
    async def transition_state(
        db: AsyncSession, 
        instance_id: str, 
        action: str = "auto", 
        result_data: Dict[str, Any] = None
    ) -> WorkflowInstance:
        """Transitions a workflow to the next step based on its definition."""
        
        try:
            instance_uuid = uuid.UUID(instance_id)
        except ValueError:
            raise ValueError("Invalid instance ID")
            
        # Fetch the instance
        result = await db.execute(select(WorkflowInstance).where(WorkflowInstance.id == instance_uuid))
        instance = result.scalar_one_or_none()
        
        if not instance:
            raise ValueError(f"Workflow instance {instance_id} not found")
            
        if instance.status != WorkflowStatus.active:
            raise ValueError(f"Cannot transition workflow in status: {instance.status}")
            
        workflow_def = WorkflowEngine.WORKFLOW_DEFINITIONS.get(instance.workflow_name)
        if not workflow_def:
             raise ValueError(f"No state machine definition for workflow: {instance.workflow_name}")
             
        current_step = instance.current_step
        next_step = workflow_def.get(current_step)
        
        # Complete the current highest task if one exists
        tasks_result = await db.execute(
            select(WorkflowTask)
            .where(WorkflowTask.workflow_instance_id == instance.id)
            .where(WorkflowTask.step_id == current_step)
            .where(WorkflowTask.status == TaskStatus.pending)
        )
        current_task = tasks_result.scalars().first()
        
        if current_task:
             current_task.status = TaskStatus.completed
             current_task.completed_at = datetime.utcnow()
             current_task.result_data = result_data or {}
             
        # Update instance state
        if next_step == "completed":
            instance.status = WorkflowStatus.completed
            instance.completed_at = datetime.utcnow()
        elif next_step:
            instance.current_step = next_step
            # Create a new task for the next step
            await WorkflowEngine._create_task(db, instance, action)
        else:
            raise ValueError(f"Invalid transition from step {current_step}")
            
        # Merge new data into state
        if result_data:
             instance.state_data = {**instance.state_data, **result_data}
             
        await db.commit()
        await db.refresh(instance)
        
        return instance

    @staticmethod
    async def _create_task(db: AsyncSession, instance: WorkflowInstance, action: str):
         task = WorkflowTask(
              workflow_instance_id=instance.id,
              step_id=instance.current_step,
              action=action,
              status=TaskStatus.pending,
              started_at=datetime.utcnow()
         )
         db.add(task)
         # We don't commit here, we assume the caller commits
