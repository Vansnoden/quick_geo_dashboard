### QUICK GEO_DASHBOARD TOOL

You have georeference data in excel or csv
and need to share quick insights with collaborators 
and map your data. This tools could be for you.


#### DEPLOYMENT

##### PRODUCTION DEPLOYMENT

- Create a backend environment file from the provided template, found in <a href="backend/.env.prod.template">backend/.env/prod.template</a>, update the details to your personal preferences. Your file should be named ```.env```.

- Create a frontend environment file from the provided template, found in <a href="frontend/.env.prod.template">frontend/.env/prod.template</a>, update the details to your personal preferences. Your file should be named ```.env```.

- You can update the services ports in the project docker-compose.yaml file to your desired preferences.

- Build the containers via docker compose: 

```docker compose build; docker compose up -d```

- Update production database:

```docker exec -it <backend_container_id> alembic upgrade head```

- Run ```docker ps``` to see the port to use to access both the backend on frontend in your browser.



##### LOCAL DEVELOPMENT DEPLOYMENT

- Create a backend environment file from the provided template, found in <a href="backend/.env.dev.template">backend/.env/prod.template</a>, update the details to your personal preferences. Your file should be named ```.env```.

- Create a frontend environment file from the provided template, found in <a href="frontend/.env.dev.template">frontend/.env.prod.template</a>, update the details to your personal preferences. Your file should be named ```.env```.

- Navigate to backend/ folder: 

    - create a python and activate a python virtual environment:

        ```python3 -m venv venv```

        ```source venv/source/activate```

    - Install the python requirements:

        ```pip install -r requirements.txt```

    - Initialize database via alembic:

        ```alembic upgrade head```

    - Start the backend API: 

        ```uvicorn main:app --reload```

- Navigate to frontend/ folder:

    - [Optional] Select node version with NVM, the project used version 22 during initial development.

    - Install dependencies via pnpm:

        ```pnpm install```

    - Start the application :

        ```pnpm run dev```

