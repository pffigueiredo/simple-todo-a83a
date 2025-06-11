
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const getTodo = async (input: GetTodoInput): Promise<Todo> => {
  try {
    // Query for the specific todo
    const results = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    // Check if todo exists
    if (results.length === 0) {
      throw new Error('Todo not found');
    }

    return results[0];
  } catch (error) {
    console.error('Get todo failed:', error);
    throw error;
  }
};
