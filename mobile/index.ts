import { registerRootComponent } from 'expo';

import App from './App';
import { initializeMonitoringFromEnvironment } from './src/observability/monitoring';

void initializeMonitoringFromEnvironment();

registerRootComponent(App);
