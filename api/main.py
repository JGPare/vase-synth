import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from api.routes import auth, vases


def create_app() -> FastAPI:
    app = FastAPI(title="Vase Synth API")

    # CORS — allow Vite dev server
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(vases.router)
    app.include_router(auth.router)

    # Serve built SPA in production
    dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")
    if os.path.isdir(dist_dir):
        assets_dir = os.path.join(dist_dir, "assets")
        if os.path.isdir(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        @app.get("/{path:path}")
        async def serve_spa(path: str):
            # Don't intercept /api routes (already handled by routers)
            file_path = os.path.join(dist_dir, path)
            if os.path.isfile(file_path):
                return FileResponse(file_path)
            return FileResponse(os.path.join(dist_dir, "index.html"))

    return app


app = create_app()
