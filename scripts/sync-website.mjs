import { readFile, mkdir, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';
const destination=process.argv[2];
if(!destination)throw Error('Pass the absolute path to the jpress123.github.io website repository.');
const root=path.resolve(destination);
if(!path.isAbsolute(destination)||!(await stat(path.join(root,'.git'))).isDirectory())throw Error('Choose an existing website Git repository.');
const domain=(await readFile(path.join(root,'CNAME'),'utf8')).trim();
if(domain!=='www.josephpress.com')throw Error('The selected repository does not use www.josephpress.com.');
for(const file of ['index.html','config.js','assets/app.js','assets/app.css']){
 const target=path.join(root,'quickstarter',file);await mkdir(path.dirname(target),{recursive:true});await copyFile(file,target);
}
console.log('Updated only quickstarter/index.html, config.js, assets/app.js and assets/app.css in '+root);
