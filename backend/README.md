Run FastAPI server

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip freeze > requirements.txt
pip install -r requirements.txt
python main.py
```