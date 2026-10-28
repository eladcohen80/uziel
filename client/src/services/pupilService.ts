import { authFetch } from './api'
import { API_BASE } from './config'
import type { Pupil } from '../types/Pupil'
const API_URL = `${API_BASE}/api/pupils`

// Postgres מחזיר שמות עמודות באותיות קטנות
type PupilRow = {
  id: string
  name: string
  class_name: string
  startyeargrade1: number
  integration: string
  diagnosis: string
  educationalresponse: string
  emotionalresponse: string
  otherresponse: string
  notes: string
}

function mapPupil(row: PupilRow): Pupil {
  return {
    id: row.id,
    name: row.name,
    className: row.class_name,
    startYearGrade1: row.startyeargrade1,
    Integration: row.integration,
    Diagnosis: row.diagnosis,
    Educationalresponse: row.educationalresponse,
    Emotionalresponse: row.emotionalresponse,
    Otherresponse: row.otherresponse,
    Notes: row.notes
  }
}

export async function getPupils(): Promise<Pupil[]> {
  const response = await authFetch(API_URL)
  if (!response.ok) {
    throw new Error('Failed to fetch pupils')
  }
  const rows: PupilRow[] = await response.json()
  return rows.map(mapPupil)
}

export async function getPupilById(id: string): Promise<Pupil> {
  const response = await authFetch(`${API_URL}/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch pupil')
  }
  return mapPupil(await response.json())
}

export async function createPupil(pupil: Pupil): Promise<Pupil> {
  const response = await authFetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(pupil)
  })
  if (!response.ok) {
    throw new Error('Failed to create pupil')
  }
  return response.json()
}

export async function updatePupil(pupil: Pupil): Promise<Pupil> {
  const response = await authFetch(`${API_URL}/${pupil.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(pupil)
  })
  if (!response.ok) {
    throw new Error('Failed to update pupil')
  }
  return response.json()
}

export async function deletePupil(id: string): Promise<void> {
  const response = await authFetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error('Failed to delete pupil')
  }
}