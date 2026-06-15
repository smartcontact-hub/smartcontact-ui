import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { migrateStorageKeys } from './app/core/utils/storage-migration';

/**
 * Ejecuta migration de localStorage ANTES del bootstrap. Los `LocalStore`
 * leen del namespace `sc-*` kebab directamente; sin esta llamada temprana,
 * los stores se instancian con storageKey nuevo y los datos legacy
 * `smartcontact_*` quedarían huérfanos. Marker flag idempotente — corre
 * una vez por navegador.
 */
migrateStorageKeys();

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
