const ExportStrategyFactory = require('./backend/patterns/strategy/export/ExportStrategyFactory');

const mockData = [
  { id: 1, name: 'Product A', price: 100 },
  { id: 2, name: 'Product B', price: 200 }
];

async function testExport() {
  const formats = ['csv', 'excel', 'pdf'];
  
  console.log('--- Testing Export Factory ---');
  console.log('Supported Formats:', ExportStrategyFactory.getSupportedFormats());

  for (const format of formats) {
    console.log(`\nTesting format: ${format.toUpperCase()}`);
    try {
      const strategy = ExportStrategyFactory.createStrategy(format);
      const output = await strategy.export(mockData);
      console.log('Content Type:', strategy.getContentType());
      console.log('Extension:', strategy.getFileExtension());
      console.log('Output Preview:');
      console.log(output.substring(0, 200) + '...');
    } catch (error) {
      console.error(`Error with ${format}:`, error.message);
    }
  }

  console.log('\nTesting unsupported format: xml');
  try {
    ExportStrategyFactory.createStrategy('xml');
  } catch (error) {
    console.log('Expected Error:', error.message);
  }
}

testExport();
