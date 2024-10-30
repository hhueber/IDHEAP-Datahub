from webapp import app
from webapp.config import SERVER_HOST, SERVER_PORT


application = app

# Default port:
if __name__ == "__main__":
    application.run(host=SERVER_HOST, port=SERVER_PORT)
