from tasks.models import Task

class TaskService:
    @staticmethod
    def update_task_status(task, status):
        task.status = status
        task.save()
        if task.goal:
            task.goal.update_progress()
        return task

    @staticmethod
    def soft_delete_task(task):
        task.soft_delete()
        if task.goal:
            task.goal.update_progress()
        return True
