"""
CORS Middleware Configuration for the Neotic Backend.
"""
# pylint: disable=import-error
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

def setup_cors(app: FastAPI):
    """
    Configure Cross-Origin Resource Sharing (CORS) policies for the application.
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
