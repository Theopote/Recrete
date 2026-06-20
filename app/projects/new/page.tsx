"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { createProjectSchema, type CreateProjectFormValues } from "@/lib/validators/project";
import { generateProjectCode } from "@/lib/utils";
import { useState } from "react";

export default function CreateProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      budgetLevel: "medium",
      heritageLevel: "none",
      basementCount: 0,
      code: generateProjectCode("New", new Date().getFullYear()),
    },
  });

  const onSubmit = async (data: CreateProjectFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const project = await res.json();
        router.push(`/projects/${project.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <TopBar title="Create Project" subtitle="New renovation project" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
          <SectionHeader
            title="New Renovation Project"
            description="Enter building information and renovation goals to create a new project workspace"
          />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormSection title="1. Basic Information">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Project Name" error={errors.name?.message}>
                  <Input {...register("name")} placeholder="Old Concrete Office Renewal" />
                </Field>
                <Field label="Project Code" error={errors.code?.message}>
                  <Input {...register("code")} />
                </Field>
              </div>
              <Field label="Location" error={errors.location?.message}>
                <Input {...register("location")} placeholder="Xi'an, China" />
              </Field>
              <Field label="Description" error={errors.description?.message}>
                <Textarea {...register("description")} placeholder="Brief project description..." />
              </Field>
            </FormSection>

            <FormSection title="2. Building Information">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Building Type" error={errors.buildingType?.message}>
                  <Input {...register("buildingType")} placeholder="Office building" />
                </Field>
                <Field label="Construction Year" error={errors.constructionYear?.message}>
                  <Input type="number" {...register("constructionYear")} />
                </Field>
                <Field label="Structure Type" error={errors.structureType?.message}>
                  <Input {...register("structureType")} placeholder="Reinforced concrete frame" />
                </Field>
                <Field label="Floor Count" error={errors.floorCount?.message}>
                  <Input type="number" {...register("floorCount")} />
                </Field>
                <Field label="Gross Floor Area (sqm)" error={errors.grossFloorArea?.message}>
                  <Input type="number" {...register("grossFloorArea")} />
                </Field>
                <Field label="Basement Count" error={errors.basementCount?.message}>
                  <Input type="number" {...register("basementCount")} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Building Name" error={errors.buildingName?.message}>
                  <Input {...register("buildingName")} placeholder="Former Municipal Office Block A" />
                </Field>
                <Field label="Address" error={errors.address?.message}>
                  <Input {...register("address")} />
                </Field>
              </div>
              <Field label="Heritage Level" error={errors.heritageLevel?.message}>
                <Select {...register("heritageLevel")}>
                  <option value="none">None</option>
                  <option value="local">Local</option>
                  <option value="provincial">Provincial</option>
                  <option value="national">National</option>
                  <option value="world">World</option>
                </Select>
              </Field>
            </FormSection>

            <FormSection title="3. Current Condition">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Original Function" error={errors.originalFunction?.message}>
                  <Input {...register("originalFunction")} placeholder="Government office" />
                </Field>
                <Field label="Current Function" error={errors.currentFunction?.message}>
                  <Input {...register("currentFunction")} placeholder="Vacant office" />
                </Field>
                <Field label="Target Function" error={errors.targetFunction?.message}>
                  <Input {...register("targetFunction")} placeholder="Community cultural center" />
                </Field>
              </div>
              <Field label="Current Condition" error={errors.currentCondition?.message}>
                <Textarea
                  {...register("currentCondition")}
                  placeholder="Describe the current physical condition of the building..."
                />
              </Field>
            </FormSection>

            <FormSection title="4. Renovation Goal">
              <Field label="Renovation Goal" error={errors.renovationGoal?.message}>
                <Textarea
                  {...register("renovationGoal")}
                  placeholder="Describe the renovation vision and objectives..."
                  className="min-h-[100px]"
                />
              </Field>
            </FormSection>

            <FormSection title="5. Budget and Schedule">
              <Field label="Budget Level" error={errors.budgetLevel?.message}>
                <Select {...register("budgetLevel")}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="premium">Premium</option>
                </Select>
              </Field>
            </FormSection>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" variant="copper" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </AppShell>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h3 className="text-sm font-medium border-b pb-2">{title}</h3>
        {children}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
