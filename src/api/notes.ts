import { authFetch } from '../utils/api';
import type { Note, NoteListResponse, CreateNoteRequest, UpdateNoteRequest, NoteFilters } from '../types/notes';

export const getNotes = async (filters: NoteFilters = {}): Promise<NoteListResponse> => {
  const queryParams = new URLSearchParams();
  if (filters.page) queryParams.append('page', filters.page.toString());
  if (filters.limit) queryParams.append('limit', filters.limit.toString());
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.start_date) queryParams.append('start_date', filters.start_date);
  if (filters.end_date) queryParams.append('end_date', filters.end_date);
  if (filters.request_uuid) queryParams.append('request_uuid', filters.request_uuid);

  return await authFetch<NoteListResponse>(`/notes?${queryParams.toString()}`);
};

export const getUpcomingReminders = async (startDate?: string, endDate?: string): Promise<Note[]> => {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('start_date', startDate);
  if (endDate) queryParams.append('end_date', endDate);

  return await authFetch<Note[]>(`/notes/reminders?${queryParams.toString()}`);
};

export const createNote = async (data: CreateNoteRequest): Promise<Note> => {
  return await authFetch<Note>('/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateNote = async (id: string, data: UpdateNoteRequest): Promise<Note> => {
  return await authFetch<Note>(`/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteNote = async (id: string): Promise<void> => {
  await authFetch(`/notes/${id}`, {
    method: 'DELETE',
  });
};
