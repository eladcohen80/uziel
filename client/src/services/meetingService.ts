import { authFetch } from './api'
import { API_BASE } from './config'
import type { Meeting } from '../types/Meeting'
const API_URL = `${API_BASE}/api/meetings`

export async function getAllMeetings(): Promise<Meeting[]> {
    const response = await authFetch(API_URL)
    if (!response.ok) {
        throw new Error('Failed to fetch meetings')
    }
    return response.json()
}

export async function getMeetings(pupil_id: string): Promise<Meeting[]> {
    const response = await authFetch(`${API_URL}/${pupil_id}`)
    if (!response.ok) {
        throw new Error('Failed to fetch meetings')
    }
    return response.json()
}

export async function getMeetingById(id: string): Promise<Meeting> {
    const response = await authFetch(`${API_URL}/meeting/${id}`)
    if (!response.ok) {
        throw new Error('Failed to fetch meeting')
    }
    return response.json()
}

export async function createMeeting(meeting: Meeting): Promise<Meeting> {
    const response = await authFetch(`${API_URL}/meeting`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(meeting)
    })
    if (!response.ok) {
        throw new Error('Failed to create meeting')
    }
    return response.json()
}

export async function updateMeeting(id: string, meeting: Meeting): Promise<Meeting> {
    const response = await authFetch(`${API_URL}/meeting/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(meeting)
    })
    if (!response.ok) {
        throw new Error('Failed to update meeting')
    }
    return response.json()
}

export async function deleteMeeting(id: string): Promise<{ message: string }> {
    const response = await authFetch(`${API_URL}/meeting/${id}`, {
        method: 'DELETE'
    })
    if (!response.ok) {
        throw new Error('Failed to delete meeting')
    }
    return response.json()
}
