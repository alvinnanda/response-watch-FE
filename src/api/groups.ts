import { authFetch } from '../utils/api';

export interface VendorGroup {
  id: string;
  group_name: string;
  pic_names: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateVendorGroupPayload {
  group_name: string;
  pic_names: string[];
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

export async function deleteGroup(id: string): Promise<void> {
  return authFetch<void>(`/vendor-groups/${id}`, {
    method: 'DELETE',
  });
}
