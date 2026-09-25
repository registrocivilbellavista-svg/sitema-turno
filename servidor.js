    // API ENDPOINTS: OBTENER Y AGREGAR REGISTROS DE LA AGENDA
    else if (req.url === '/api/agenda' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(fs.readFileSync(DB_AGENDA, 'utf8'));
    }
    else if (req.url === '/api/agenda' && req.method === 'POST') {
        let body = ''; req.on('data', c => body += c);
        req.on('end', () => {
            const item = JSON.parse(body); 
            item.id = "ID-" + Date.now() + Math.floor(Math.random() * 1000);
            if(item.atendido === undefined) item.atendido = false;
            
            let lista = JSON.parse(fs.readFileSync(DB_AGENDA, 'utf8'));
            lista.push(item); 
            fs.writeFileSync(DB_AGENDA, JSON.stringify(lista, null, 2));
            res.writeHead(201, { 'Content-Type': 'application/json' }); 
            res.end(JSON.stringify(item));
        });
    }
    
    // API ENDPOINTS: MODIFICAR COMPATIBLE CON ID STRINGS
    else if (req.url.startsWith('/api/agenda/') && req.method === 'PUT') {
        const id = req.url.split('/').pop();
        let body = ''; req.on('data', c => body += c);
        req.on('end', () => {
            const modificado = JSON.parse(body);
            let lista = JSON.parse(fs.readFileSync(DB_AGENDA, 'utf8'));
            lista = lista.map(item => item.id === id ? { ...item, ...modificado } : item);
            fs.writeFileSync(DB_AGENDA, JSON.stringify(lista, null, 2));
            res.writeHead(200, { 'Content-Type': 'application/json' }); 
            res.end(JSON.stringify({ OK: true }));
        });
    }
