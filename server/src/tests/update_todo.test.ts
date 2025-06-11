
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper function to create a todo for testing
const createTestTodo = async (input: CreateTodoInput) => {
  const result = await db.insert(todosTable)
    .values({
      title: input.title,
      description: input.description || null,
      completed: false
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title', async () => {
    // Create a todo first
    const createInput: CreateTodoInput = {
      title: 'Original Title',
      description: 'Original description'
    };
    const createdTodo = await createTestTodo(createInput);

    // Update the title
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'Updated Title'
    };
    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.completed).toEqual(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdTodo.updated_at).toBe(true); // Should be newer
  });

  it('should update todo description', async () => {
    // Create a todo first
    const createInput: CreateTodoInput = {
      title: 'Test Todo',
      description: 'Original description'
    };
    const createdTodo = await createTestTodo(createInput);

    // Update the description
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      description: 'Updated description'
    };
    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Test Todo'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false); // Should remain unchanged
  });

  it('should update todo completed status', async () => {
    // Create a todo first
    const createInput: CreateTodoInput = {
      title: 'Test Todo',
      description: 'Test description'
    };
    const createdTodo = await createTestTodo(createInput);

    // Update completed status
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      completed: true
    };
    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Test Todo'); // Should remain unchanged
    expect(result.description).toEqual('Test description'); // Should remain unchanged
    expect(result.completed).toEqual(true);
  });

  it('should update multiple fields at once', async () => {
    // Create a todo first
    const createInput: CreateTodoInput = {
      title: 'Original Title',
      description: 'Original description'
    };
    const createdTodo = await createTestTodo(createInput);

    // Update multiple fields
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true
    };
    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should set description to null when explicitly provided', async () => {
    // Create a todo with description first
    const createInput: CreateTodoInput = {
      title: 'Test Todo',
      description: 'Original description'
    };
    const createdTodo = await createTestTodo(createInput);

    // Update description to null
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      description: null
    };
    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.description).toBeNull();
  });

  it('should save updated todo to database', async () => {
    // Create a todo first
    const createInput: CreateTodoInput = {
      title: 'Test Todo',
      description: 'Test description'
    };
    const createdTodo = await createTestTodo(createInput);

    // Update the todo
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'Updated Title',
      completed: true
    };
    await updateTodo(updateInput);

    // Verify changes were saved to database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Updated Title');
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when todo does not exist', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999999, // Non-existent ID
      title: 'Updated Title'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/not found/i);
  });
});
