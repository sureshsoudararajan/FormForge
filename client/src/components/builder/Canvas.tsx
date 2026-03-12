import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useFormStore } from '@/stores/formStore';
import CanvasField from './CanvasField';
import { Layers } from 'lucide-react';

export default function Canvas() {
  const { fields, reorderFields, selectField } = useFormStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderFields(active.id as string, over.id as string);
    }
  }

  if (fields.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-float">
            <Layers className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Start building your form</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Click fields from the left sidebar to add them to your form, or use the AI generator to create one from a prompt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) selectField(null);
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <div className="max-w-2xl mx-auto space-y-3">
            {fields.map((field) => (
              <CanvasField key={field.id} field={field} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
