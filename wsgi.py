from webapp import create_app
from webapp.config import Config


application = create_app()

# Default port:
if __name__ == "__main__":
    application.run(host=Config.SERVER_HOST, port=Config.SERVER_PORT)
