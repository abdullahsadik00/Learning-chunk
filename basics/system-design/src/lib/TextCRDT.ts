import type { CRDTOperation } from '@/types';

export class TextCRDT {
  private operations: CRDTOperation[] = [];
  private appliedIds = new Set<string>();
  private clock = 0;

  insert(authorId: string, position: number, char: string): CRDTOperation {
    const op: CRDTOperation = {
      id: `${authorId}-${++this.clock}-${Math.random().toString(36).slice(2)}`,
      type: 'insert',
      position,
      char,
      authorId,
      timestamp: this.clock,
    };
    this.applyLocal(op);
    return op;
  }

  delete(authorId: string, position: number): CRDTOperation | null {
    const visible = this.getVisibleOps();
    if (position < 0 || position >= visible.length) return null;
    const target = visible[position];
    const op: CRDTOperation = {
      id: `${authorId}-${++this.clock}-del`,
      type: 'delete',
      position,
      authorId,
      timestamp: this.clock,
      // char holds the target op id to delete
      char: target.id,
    };
    target.deleted = true;
    this.appliedIds.add(op.id);
    return op;
  }

  applyRemoteOperation(op: CRDTOperation): void {
    if (this.appliedIds.has(op.id)) return; // idempotent
    this.clock = Math.max(this.clock, op.timestamp) + 1;
    if (op.type === 'insert') {
      this.applyLocal(op);
    } else if (op.type === 'delete') {
      // op.char holds the target op id
      const target = this.operations.find(o => o.id === op.char);
      if (target) target.deleted = true;
      this.appliedIds.add(op.id);
    }
  }

  private applyLocal(op: CRDTOperation): void {
    // Insert at Lamport-ordered position
    const insertAfterIdx = this.findInsertPosition(op);
    this.operations.splice(insertAfterIdx, 0, op);
    this.appliedIds.add(op.id);
  }

  private findInsertPosition(op: CRDTOperation): number {
    // Count visible chars up to op.position, then resolve ties by timestamp/authorId
    let count = 0;
    for (let i = 0; i < this.operations.length; i++) {
      const o = this.operations[i];
      if (!o.deleted) {
        if (count === op.position) {
          // tie-break by timestamp then authorId
          if (
            o.timestamp > op.timestamp ||
            (o.timestamp === op.timestamp && o.authorId > op.authorId)
          ) {
            return i;
          }
        }
        count++;
      }
    }
    return this.operations.length;
  }

  private getVisibleOps(): CRDTOperation[] {
    return this.operations.filter(o => !o.deleted && o.type === 'insert');
  }

  getText(): string {
    return this.getVisibleOps()
      .map(o => o.char ?? '')
      .join('');
  }

  getOperationCount(): number {
    return this.operations.length;
  }
}
