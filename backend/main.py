def main():
    """Production entry point for the backend server."""
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT") == "development",
    )


if __name__ == "__main__":
    main()
