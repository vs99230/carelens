"""Stable local runner for the CareLens FastAPI backend."""
import argparse

import uvicorn


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the CareLens backend.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable WatchFiles reload. On Windows/Python 3.13 this can be noisy; leave it off if reload crashes.",
    )
    args = parser.parse_args()

    uvicorn.run("app.main:app", host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()
