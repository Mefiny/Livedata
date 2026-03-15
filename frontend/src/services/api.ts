import axios from 'axios';
import type { DataSchema } from '../types/messages';

const api = axios.create({
  baseURL: '/api',
});

export async function createSession(): Promise<string> {
  const res = await api.get('/session');
  return res.data.session_id;
}

export async function uploadCSV(
  sessionId: string,
  file: File
): Promise<{ schema: DataSchema; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/upload/${sessionId}`, formData);
  return res.data;
}

export async function loadSampleDataset(
  sessionId: string,
  scenario: string
): Promise<{ schema: DataSchema; scenario: string }> {
  const res = await api.post(`/load-sample/${sessionId}/${scenario}`);
  return res.data;
}

export async function getSamples(): Promise<
  Record<string, { name: string; description: string; filename: string }>
> {
  const res = await api.get('/samples');
  return res.data;
}

export async function getSchema(sessionId: string): Promise<DataSchema> {
  const res = await api.get(`/schema/${sessionId}`);
  return res.data;
}
