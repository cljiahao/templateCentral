#!/bin/sh
set -e

MODE="${1:-prod}"
PORT="${PORT:-8000}"
WORKERS="${WORKERS:-2}"

# ── Framework detection ──────────────────────────────────────────────
# Checks dependency files to determine which framework is installed,
# then sets the appropriate server command for dev and prod modes.
#
#   FastAPI  → uvicorn (async, ASGI)
#   Django   → gunicorn with WSGI (auto-detects project name from manage.py)
#   Flask    → gunicorn with app:app
#   Fallback → python main.py
# ─────────────────────────────────────────────────────────────────────

detect_framework() {
  DEPS_CONTENT=""
  for f in requirements.txt src/requirements.txt requirements/*.txt pyproject.toml setup.py setup.cfg; do
    if [ -f "$f" ]; then
      DEPS_CONTENT="$DEPS_CONTENT $(cat "$f")"
    fi
  done

  if echo "$DEPS_CONTENT" | grep -qi "fastapi"; then
    echo "fastapi"
  elif echo "$DEPS_CONTENT" | grep -qi "django"; then
    echo "django"
  elif echo "$DEPS_CONTENT" | grep -qi "flask"; then
    echo "flask"
  else
    echo "unknown"
  fi
}

# For Django, find the WSGI module by locating manage.py's parent settings.
detect_django_wsgi() {
  if [ -f manage.py ]; then
    SETTINGS_MODULE=$(grep -oP "DJANGO_SETTINGS_MODULE.*?['\"]([^'\"]+)['\"]" manage.py 2>/dev/null | head -1 | grep -oP "['\"]([^'\"]+)['\"]" | tr -d "'\"")
    if [ -n "$SETTINGS_MODULE" ]; then
      echo "${SETTINGS_MODULE%.*}.wsgi"
      return
    fi
  fi

  # Fallback: look for wsgi.py anywhere in the project
  WSGI_FILE=$(find . -name "wsgi.py" -not -path "./.venv/*" 2>/dev/null | head -1)
  if [ -n "$WSGI_FILE" ]; then
    echo "$WSGI_FILE" | sed 's|^\./||; s|/|.|g; s|\.py$||'
    return
  fi

  echo "config.wsgi"
}

FRAMEWORK=$(detect_framework)
echo "Detected framework: $FRAMEWORK"

case "$MODE" in
  dev)
    case "$FRAMEWORK" in
      fastapi)
        echo "Starting FastAPI dev server (uvicorn --reload)..."
        exec uvicorn app:app --app-dir src --host 0.0.0.0 --port "$PORT" --reload
        ;;
      django)
        echo "Starting Django dev server..."
        exec python manage.py runserver "0.0.0.0:$PORT"
        ;;
      flask)
        echo "Starting Flask dev server..."
        exec flask run --host 0.0.0.0 --port "$PORT" --reload
        ;;
      *)
        echo "Unknown framework. Running: python main.py"
        exec python main.py
        ;;
    esac
    ;;

  prod)
    case "$FRAMEWORK" in
      fastapi)
        echo "Starting FastAPI production server (uvicorn, $WORKERS workers)..."
        exec uvicorn app:app --app-dir src --host 0.0.0.0 --port "$PORT" --workers "$WORKERS"
        ;;
      django)
        WSGI_MODULE=$(detect_django_wsgi)
        echo "Starting Django production server (gunicorn $WSGI_MODULE, $WORKERS workers)..."
        exec gunicorn "$WSGI_MODULE:application" --bind "0.0.0.0:$PORT" --workers "$WORKERS"
        ;;
      flask)
        echo "Starting Flask production server (gunicorn, $WORKERS workers)..."
        exec gunicorn "app:app" --bind "0.0.0.0:$PORT" --workers "$WORKERS"
        ;;
      *)
        echo "Unknown framework. Running: python main.py"
        exec python main.py
        ;;
    esac
    ;;

  *)
    # Pass through any other command (e.g., "python manage.py migrate")
    exec "$@"
    ;;
esac
