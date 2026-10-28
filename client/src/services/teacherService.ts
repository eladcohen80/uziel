import { authFetch } from './api'
import type { Teacher } from '../types/Teacher'
const API_URL = '/api/teachers'

export async function getTeachers(): Promise<Teacher[]> {
  const response = await authFetch(API_URL)
  if (!response.ok) {
    throw new Error('Failed to fetch teachers')
  }
  return response.json()
}

export async function getTeacherById(id: string): Promise<Teacher> {
  const response = await authFetch(`${API_URL}/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch teacher')
  }
  return response.json()
}

export async function getAvailableTeachers(): Promise<Pick<Teacher, 'id' | 'name' | 'grade' | 'position'>[]> {
  const response = await fetch(`${API_URL}/available`)
  if (!response.ok) {
    throw new Error('Failed to fetch teachers')
  }
  return response.json()
}

export async function createTeacher(teacher: Teacher): Promise<Teacher> {
  const response = await authFetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(teacher)
  })
  if (!response.ok) {
    throw new Error('Failed to create teacher')
  }
  return response.json()
}

export async function updateTeacher(teacher: Teacher): Promise<Teacher> {
  const response = await authFetch(`${API_URL}/${teacher.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(teacher)
  })
  if (!response.ok) {
    throw new Error('Failed to update teacher')
  }
  return response.json()
}

export async function deleteTeacher(id: string): Promise<void> {
  const response = await authFetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error('Failed to delete teacher')
  }
}