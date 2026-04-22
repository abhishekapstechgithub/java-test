package com.taskmanager;

import com.taskmanager.model.Task;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class TaskServiceTest {

    @Autowired
    private TaskService taskService;

    @Autowired
    private TaskRepository taskRepository;

    @BeforeEach
    void setUp() {
        taskRepository.deleteAll();
    }

    @Test
    void testCreateTask() {
        Task task = new Task();
        task.setTitle("Test Task");
        task.setDescription("Test Description");

        Task saved = taskService.createTask(task);

        assertNotNull(saved.getId());
        assertEquals("Test Task", saved.getTitle());
        assertEquals(Task.Status.TODO, saved.getStatus());
    }

    @Test
    void testGetAllTasks() {
        Task t1 = new Task();
        t1.setTitle("Task 1");
        taskService.createTask(t1);

        Task t2 = new Task();
        t2.setTitle("Task 2");
        taskService.createTask(t2);

        assertEquals(2, taskService.getAllTasks().size());
    }

    @Test
    void testUpdateTaskStatus() {
        Task task = new Task();
        task.setTitle("My Task");
        Task saved = taskService.createTask(task);

        saved.setStatus(Task.Status.DONE);
        Task updated = taskService.updateTask(saved.getId(), saved);

        assertEquals(Task.Status.DONE, updated.getStatus());
    }

    @Test
    void testDeleteTask() {
        Task task = new Task();
        task.setTitle("To Delete");
        Task saved = taskService.createTask(task);

        taskService.deleteTask(saved.getId());

        assertTrue(taskService.getTaskById(saved.getId()).isEmpty());
    }
}
