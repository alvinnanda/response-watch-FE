import { authFetch } from '../utils/api';

// PIC structure with name and phone
export interface PIC {
  name: string;
  phone?: string;
}

export interface VendorGroup {
  id: string;
  group_name: string;
  vendor_phone?: string;
  pics: PIC[];
  pic_names: string[]; // For backward compatibility
  created_at: string;
  updated_at: string;
}

export interface CreateVendorGroupPayload {
  group_name: string;
  vendor_phone?: string;
  pics: PIC[];
}

export interface GroupPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface GetGroupsResponse {
  vendor_groups: VendorGroup[];
  pagination: GroupPagination;
}

export async function getGroups(page = 1, limit = 10): Promise<GetGroupsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  return authFetch<GetGroupsResponse>(`/vendor-groups?${params.toString()}`);
}

export async function createGroup(data: CreateVendorGroupPayload): Promise<VendorGroup> {
  return authFetch<VendorGroup>('/vendor-groups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGroup(id: string, data: CreateVendorGroupPayload): Promise<VendorGroup> {
  return authFetch<VendorGroup>(`/vendor-groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteGroup(id: string): Promise<void> {
  return authFetch<void>(`/vendor-groups/${id}`, {
    method: 'DELETE',
  });
}

