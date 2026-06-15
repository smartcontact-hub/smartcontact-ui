/**
 * Modelo de Entidad Memory · datos concretos que la IA extrae del
 * texto de las conversaciones (importes, productos, identificadores,
 * fechas, etc.).
 *
 * Migrado desde `EntitiesContext.tsx` del prototipo React. 18 tipos
 * cubiertos: del primitivo (text/number/date) al específico de
 * call-center (phone_number/key_phrase/dimension).
 *
 * Las **system entities** (`isSystem: true`) son inmutables — el
 * supervisor las consume pero no puede editar ni borrar. Las user
 * entities son personalizables.
 */
export type EntityType =
  | 'text'
  | 'number'
  | 'date'
  | 'email'
  | 'phone'
  | 'list'
  | 'name'
  | 'age'
  | 'url'
  | 'ordinal'
  | 'currency'
  | 'datetime'
  | 'dimension'
  | 'geography'
  | 'key_phrase'
  | 'percentage'
  | 'phone_number'
  | 'temperature';

export interface EntityListValue {
  readonly value: string;
  readonly synonyms: readonly string[];
}

export interface EntityValidation {
  readonly regex: string;
  readonly message?: string;
}

export interface EntityConfig {
  readonly listValues?: readonly EntityListValue[];
  readonly defaultValue?: string;
  readonly validation?: EntityValidation;
}

export interface Entity {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: EntityType;
  readonly color?: string;
  readonly isSystem: boolean;
  readonly config?: EntityConfig;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly format?: string;
}
