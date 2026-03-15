import { pluginRegistry } from './registry';
import { dataSourcePlugin } from './dataSource';
import { filterPlugin } from './filter';
import { chartPlugin } from './chart';
import { tablePlugin } from './table';
import { aiProcessorPlugin } from './aiProcessor';
import { dataCleaningPlugin } from './dataCleaning';
import { outlierDetectionPlugin } from './outlierDetection';
import { returnCalculatorPlugin } from './returnCalculator';
import { maxDrawdownPlugin } from './maxDrawdown';
import { sharpeRatioPlugin } from './sharpeRatio';
import { groupByPlugin } from './groupBy';
import { sortPlugin } from './sort';
import { statsPlugin } from './stats';

export function initializePlugins() {
  pluginRegistry.register(dataSourcePlugin);
  pluginRegistry.register(filterPlugin);
  pluginRegistry.register(chartPlugin);
  pluginRegistry.register(tablePlugin);
  pluginRegistry.register(aiProcessorPlugin);
  pluginRegistry.register(dataCleaningPlugin);
  pluginRegistry.register(outlierDetectionPlugin);
  pluginRegistry.register(returnCalculatorPlugin);
  pluginRegistry.register(maxDrawdownPlugin);
  pluginRegistry.register(sharpeRatioPlugin);
  pluginRegistry.register(groupByPlugin);
  pluginRegistry.register(sortPlugin);
  pluginRegistry.register(statsPlugin);
}

export { pluginRegistry };
