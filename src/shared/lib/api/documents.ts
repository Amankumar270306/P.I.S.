import api from './client';

export interface Document {
    id: string;  
    title: string;
    content: any;
    created_at: string;
    last_edited: string;
}

export const getDocuments = async (): Promise<Document[]> => {
    const response = await api.get('/documents/');
    return response.data;
};

export const createDocument = async (title: string, content: object | null = null): Promise<Document> => {
    const response = await api.post('/documents/', { title, content });
    return response.data;
};

export const updateDocument = async (id: string, data: Partial<Document>): Promise<Document> => {
    const response = await api.put(`/documents/${id}`, data);
    return response.data;
};

export const deleteDocument = async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
};
