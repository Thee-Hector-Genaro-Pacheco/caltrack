import prisma from '../db/prisma';
import { CreateDocumentationDto, UpdateDocumentationDto } from '@caltrack/types';
import { createAuditEvent } from './audit.service';

export async function getAllDocumentation(filters: {
  search?: string;
  manufacturer?: string;
  instrumentType?: string;
  status?: string;
}) {
  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.manufacturer) {
    where.manufacturer = { equals: filters.manufacturer, mode: 'insensitive' };
  }

  if (filters.instrumentType) {
    where.instrumentType = { equals: filters.instrumentType, mode: 'insensitive' };
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { documentNumber: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return await prisma.documentation.findMany({
    where,
    orderBy: { title: 'asc' },
    include: {
      instruments: true,
    },
  });
}

export async function getDocumentationById(id: string) {
  return await prisma.documentation.findUnique({
    where: { id },
    include: {
      instruments: true,
    },
  });
}

export async function createDocumentation(dto: CreateDocumentationDto, changedBy: string) {
  const { instrumentIds, ...data } = dto;
  
  const document = await prisma.documentation.create({
    data: {
      title: data.title,
      description: data.description || null,
      documentNumber: data.documentNumber,
      revision: data.revision,
      manufacturer: data.manufacturer || null,
      instrumentType: data.instrumentType || null,
      equipmentCategory: data.equipmentCategory || null,
      documentType: data.documentType,
      tags: data.tags || [],
      fileLocation: data.fileLocation,
      status: data.status || 'ACTIVE',
      instruments: instrumentIds && instrumentIds.length > 0 ? {
        connect: instrumentIds.map(id => ({ id })),
      } : undefined,
    },
    include: {
      instruments: true,
    },
  });

  await createAuditEvent({
    entityType: 'Documentation',
    entityId: document.id,
    action: 'CREATE',
    oldValue: null,
    newValue: document as any,
    changedBy,
    reason: 'Document Registered',
  });

  return document;
}

export async function updateDocumentation(id: string, dto: UpdateDocumentationDto, changedBy: string) {
  const oldDocument = await prisma.documentation.findUnique({
    where: { id },
    include: {
      instruments: true,
    },
  });

  if (!oldDocument) {
    throw new Error('Document not found');
  }

  const { instrumentIds, ...updateData } = dto;
  const dataToUpdate: any = {
    title: updateData.title,
    description: updateData.description !== undefined ? updateData.description : undefined,
    documentNumber: updateData.documentNumber,
    revision: updateData.revision,
    manufacturer: updateData.manufacturer !== undefined ? updateData.manufacturer : undefined,
    instrumentType: updateData.instrumentType !== undefined ? updateData.instrumentType : undefined,
    equipmentCategory: updateData.equipmentCategory !== undefined ? updateData.equipmentCategory : undefined,
    documentType: updateData.documentType,
    tags: updateData.tags,
    fileLocation: updateData.fileLocation,
    status: updateData.status,
  };

  if (instrumentIds !== undefined) {
    dataToUpdate.instruments = {
      set: instrumentIds.map(id => ({ id })),
    };
  }

  const updatedDocument = await prisma.documentation.update({
    where: { id },
    data: dataToUpdate,
    include: {
      instruments: true,
    },
  });

  await createAuditEvent({
    entityType: 'Documentation',
    entityId: id,
    action: 'UPDATE',
    oldValue: oldDocument as any,
    newValue: updatedDocument as any,
    changedBy,
    reason: 'Document Metadata Updated',
  });

  return updatedDocument;
}

export async function deleteDocumentation(id: string, changedBy: string, reason: string) {
  const document = await prisma.documentation.findUnique({
    where: { id },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  await prisma.documentation.delete({
    where: { id },
  });

  await createAuditEvent({
    entityType: 'Documentation',
    entityId: id,
    action: 'DELETE',
    oldValue: document as any,
    newValue: null,
    changedBy,
    reason: reason || 'Document Deleted',
  });

  return document;
}

export async function searchDocumentation(query: {
  instrumentId?: string;
  instrumentType?: string;
  manufacturer?: string;
  model?: string;
  tags?: string[];
}) {
  const { instrumentId, instrumentType, manufacturer, model, tags } = query;
  
  const filters: any[] = [];
  
  if (instrumentId) {
    filters.push({
      instruments: {
        some: { id: instrumentId },
      },
    });
  }
  
  if (manufacturer && instrumentType) {
    filters.push({
      AND: [
        { manufacturer: { equals: manufacturer, mode: 'insensitive' } },
        { instrumentType: { equals: instrumentType, mode: 'insensitive' } },
      ],
    });
  }
  
  if (model) {
    filters.push({
      OR: [
        { title: { contains: model, mode: 'insensitive' } },
        { description: { contains: model, mode: 'insensitive' } },
      ],
    });
  }
  
  if (tags && tags.length > 0) {
    filters.push({
      tags: {
        hasSome: tags,
      },
    });
  }
  
  if (filters.length === 0) {
    return await prisma.documentation.findMany({
      where: { status: 'ACTIVE' },
      include: { instruments: true },
    });
  }
  
  return await prisma.documentation.findMany({
    where: {
      status: 'ACTIVE',
      OR: filters,
    },
    include: {
      instruments: true,
    },
  });
}
