const assert=require('node:assert/strict');
global.MonthlyHours=require('./monthly-logic.js');
const folders=require('./folder-backup.js');
assert.equal(folders.supported(),false);
folders.configuredName().then(name=>{assert.equal(name,null);console.log('folder backup fallback test: OK')}).catch(error=>{console.error(error);process.exitCode=1});
