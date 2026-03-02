import { getDb } from '../server/db';
import { mockPharmaTemplates } from '../server/mockData';
import { pharmaTemplates as pharmaTemplatesTable } from '../drizzle/schema';

(async function seed(){
  try{
    const db = await getDb();
    if(!db){
      console.error('No DB connection (DATABASE_URL missing)');
      process.exit(1);
    }
    for(const t of mockPharmaTemplates){
      try{
        await db.insert(pharmaTemplatesTable).values(t as any);
      }catch(e){
        // ignore duplicates/errors
      }
    }
    console.log('Seeding complete');
    process.exit(0);
  }catch(err){
    console.error('Seeding failed', err);
    process.exit(2);
  }
})();
