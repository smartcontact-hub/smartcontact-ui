import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { migrateStorageKeys } from './app/core/utils/storage-migration';
import { leerEnlaceDePrueba } from './app/core/prueba/prueba-arranque';

/**
 * Ejecuta migration de localStorage ANTES del bootstrap. Los `LocalStore`
 * leen del namespace `sc-*` kebab directamente; sin esta llamada temprana,
 * los stores se instancian con storageKey nuevo y los datos legacy
 * `smartcontact_*` quedarían huérfanos. Marker flag idempotente — corre
 * una vez por navegador.
 */
migrateStorageKeys();

/**
 * Una prueba con usuarios llega con su sesión en el enlace (`#prueba=…`, DD-256): se guarda en la pestaña y se quita de
 * la dirección ANTES de que el router la lea. Solo en previews de rama y en local.
 */
leerEnlaceDePrueba();

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
