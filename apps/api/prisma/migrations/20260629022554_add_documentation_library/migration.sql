-- CreateEnum
CREATE TYPE "InstrumentStatus" AS ENUM ('ACTIVE', 'CALIBRATION_DUE', 'OVERDUE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CalibrationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SignerRole" AS ENUM ('TECHNICIAN', 'SUPERVISOR', 'QA');

-- CreateEnum
CREATE TYPE "SignatureMeaning" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkOrderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReferenceStandardStatus" AS ENUM ('ACTIVE', 'DUE_SOON', 'EXPIRED', 'OUT_OF_SERVICE');

-- CreateTable
CREATE TABLE "Instrument" (
    "id" TEXT NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "instrumentType" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "rangeMin" DOUBLE PRECISION NOT NULL,
    "rangeMax" DOUBLE PRECISION NOT NULL,
    "engineeringUnits" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" "InstrumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "maxPermissibleError" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processAreaId" TEXT,
    "controlLoopId" TEXT,
    "calibrationIntervalMonths" INTEGER NOT NULL DEFAULT 12,
    "lastCalibrationDate" TIMESTAMP(3),
    "nextCalibrationDueDate" TIMESTAMP(3),

    CONSTRAINT "Instrument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessArea" (
    "id" TEXT NOT NULL,
    "areaCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlLoop" (
    "id" TEXT NOT NULL,
    "loopNumber" TEXT NOT NULL,
    "loopTag" TEXT NOT NULL,
    "description" TEXT,
    "pidReference" TEXT,
    "processAreaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlLoop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalibrationRecord" (
    "id" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "calibrationDate" TIMESTAMP(3) NOT NULL,
    "technicianName" TEXT NOT NULL,
    "asFound" DOUBLE PRECISION,
    "asLeft" DOUBLE PRECISION,
    "passFail" BOOLEAN NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CalibrationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "CalibrationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" TEXT NOT NULL,
    "calibrationRecordId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerRole" "SignerRole" NOT NULL,
    "meaning" "SignatureMeaning" NOT NULL,
    "signatureHash" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalibrationTestPoint" (
    "id" TEXT NOT NULL,
    "calibrationRecordId" TEXT NOT NULL,
    "targetInput" DOUBLE PRECISION NOT NULL,
    "expectedOutput" DOUBLE PRECISION NOT NULL,
    "asFoundOutput" DOUBLE PRECISION NOT NULL,
    "asLeftOutput" DOUBLE PRECISION NOT NULL,
    "asFoundError" DOUBLE PRECISION NOT NULL,
    "asLeftError" DOUBLE PRECISION NOT NULL,
    "passFail" BOOLEAN NOT NULL,

    CONSTRAINT "CalibrationTestPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "changedBy" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "workOrderNumber" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "WorkOrderPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedTechnician" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceStandard" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "equipmentType" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "accuracyClass" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "lastCalibratedDate" TIMESTAMP(3) NOT NULL,
    "calibrationDueDate" TIMESTAMP(3) NOT NULL,
    "status" "ReferenceStandardStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalibrationReferenceStandard" (
    "id" TEXT NOT NULL,
    "calibrationRecordId" TEXT NOT NULL,
    "referenceStandardId" TEXT NOT NULL,
    "usageNotes" TEXT,

    CONSTRAINT "CalibrationReferenceStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documentation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "documentNumber" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "manufacturer" TEXT,
    "instrumentType" TEXT,
    "equipmentCategory" TEXT,
    "documentType" TEXT NOT NULL,
    "tags" TEXT[],
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileLocation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_InstrumentDocumentation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Instrument_tagNumber_key" ON "Instrument"("tagNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessArea_areaCode_key" ON "ProcessArea"("areaCode");

-- CreateIndex
CREATE UNIQUE INDEX "ControlLoop_loopTag_key" ON "ControlLoop"("loopTag");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_workOrderNumber_key" ON "WorkOrder"("workOrderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceStandard_assetTag_key" ON "ReferenceStandard"("assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "Documentation_documentNumber_key" ON "Documentation"("documentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "_InstrumentDocumentation_AB_unique" ON "_InstrumentDocumentation"("A", "B");

-- CreateIndex
CREATE INDEX "_InstrumentDocumentation_B_index" ON "_InstrumentDocumentation"("B");

-- AddForeignKey
ALTER TABLE "Instrument" ADD CONSTRAINT "Instrument_processAreaId_fkey" FOREIGN KEY ("processAreaId") REFERENCES "ProcessArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instrument" ADD CONSTRAINT "Instrument_controlLoopId_fkey" FOREIGN KEY ("controlLoopId") REFERENCES "ControlLoop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlLoop" ADD CONSTRAINT "ControlLoop_processAreaId_fkey" FOREIGN KEY ("processAreaId") REFERENCES "ProcessArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationRecord" ADD CONSTRAINT "CalibrationRecord_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_calibrationRecordId_fkey" FOREIGN KEY ("calibrationRecordId") REFERENCES "CalibrationRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationTestPoint" ADD CONSTRAINT "CalibrationTestPoint_calibrationRecordId_fkey" FOREIGN KEY ("calibrationRecordId") REFERENCES "CalibrationRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationReferenceStandard" ADD CONSTRAINT "CalibrationReferenceStandard_calibrationRecordId_fkey" FOREIGN KEY ("calibrationRecordId") REFERENCES "CalibrationRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationReferenceStandard" ADD CONSTRAINT "CalibrationReferenceStandard_referenceStandardId_fkey" FOREIGN KEY ("referenceStandardId") REFERENCES "ReferenceStandard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstrumentDocumentation" ADD CONSTRAINT "_InstrumentDocumentation_A_fkey" FOREIGN KEY ("A") REFERENCES "Documentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstrumentDocumentation" ADD CONSTRAINT "_InstrumentDocumentation_B_fkey" FOREIGN KEY ("B") REFERENCES "Instrument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
