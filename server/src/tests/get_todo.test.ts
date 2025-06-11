
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput } from '../schema';
import { getTodo } from '../handlers/get_todo';
import { eq } from 'drizzle-orm';

describe('getTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a todo by id', async () => {
    // Create a test todo first
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing',
        completed: false
      })
      .returning()
      .execute();

    const testInput: GetTodoInput = {
      id: createdTodo[0].id
    };

    const result = await getTodo(testInput);

    // Validate returned todo
    expect(result.id).toEqual(createdTodo[0].id);
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.completed).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should get a todo with null description', async () => {
    // Create a test todo with null description
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Todo without description',
        description: null,
        completed: true
      })
      .returning()
      .execute();

    const testInput: GetTodoInput = {
      id: createdTodo[0].id
    };

    const result = await getTodo(testInput);

    expect(result.id).toEqual(createdTodo[0].id);
    expect(result.title).toEqual('Todo without description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(true);
  });

  it('should throw error when todo does not exist', async () => {
    const testInput: GetTodoInput = {
      id: 999 // Non-existent ID
    };

    expect(getTodo(testInput)).rejects.toThrow(/todo not found/i);
  });

  it('should retrieve correct todo from multiple todos', async () => {
    // Create multiple todos
    await db.insert(todosTable)
      .values([
        { title: 'First Todo', description: 'First description', completed: false },
        { title: 'Second Todo', description: 'Second description', completed: true }
      ])
      .execute();

    // Get all todos to find the second one
    const allTodos = await db.select()
      .from(todosTable)
      .execute();

    const secondTodo = allTodos.find(todo => todo.title === 'Second Todo');
    expect(secondTodo).toBeDefined();

    const testInput: GetTodoInput = {
      id: secondTodo!.id
    };

    const result = await getTodo(testInput);

    expect(result.id).toEqual(secondTodo!.id);
    expect(result.title).toEqual('Second Todo');
    expect(result.description).toEqual('Second description');
    expect(result.completed).toEqual(true);
  });
});
