# brevity: high-performance document extraction engine

welcome to the repository for brevity, a specialized ai document extraction engine built using python, fastapi, and the groq api. while traditional tools often provide bloated summaries, i designed brevity to prioritize "ruthless conciseness." it processes dense pdf documents using meta's llama 3.1 model to extract core metrics, actionable insights, and critical details in real-time. this project serves as a showcase of my ability to build robust full-stack pipelines, handling file ingestion, asynchronous processing, and responsive frontend design.

# tech stack

- **backend framework:** fastapi (python)
- **document processing:** pdfplumber
- **ai engine:** groq api (meta llama-3.1-8b-instant)
- **security:** python-dotenv for environment variable management
- **frontend:** html5, modern css (custom transitions/animations), geist/poppins fonts
- **hosting:** render (web service)

# key features

- **ruthless conciseness:** the ai engine is hard-prompted to filter out conversational filler, ensuring summaries are dense, precise, and standalone.
- **seamless ux:** features a custom loader with hardware-accelerated animations and clean state transitions, ensuring the user experience remains stable while the backend initializes.
- **precision extraction:** capable of pulling specific metrics, dates, and contact details from unstructured document text with high fidelity.
- **resilient architecture:** robust error handling that manages cold starts (server wake-up) and document ingestion failures gracefully, providing clear feedback to the user.

# local development setup

follow these steps to run the brevity backend on your local machine.

```bash
1. clone the repository
git clone [https://github.com/mohammed-owzzz/brevity.git](https://github.com/mohammed-owzzz/brevity.git)
cd brevity

2. install dependencies
ensure you have python installed, then run:

Bash
pip install fastapi uvicorn pdfplumber groq python-dotenv

3. set up environment variables
create a file named .env in the root directory of the project. add your groq api key:

Plaintext
GROQ_API_KEY=your_actual_api_key_here
(note: the .env file is included in .gitignore to prevent accidental credential leaks.)

4. run the server
start the fastapi server using uvicorn:

Bash
uvicorn main:app --reload
the api will be available at http://127.0.0.1:8000.

api documentation
POST /summarize
accepts a pdf file upload and returns a highly condensed summary.

request:
multipart/form-data containing a file field.

response:

JSON
{
  "filename": "resume.pdf",
  "status": "success",
  "character_count": 842,
  "summary": "• Role: Junior AI Trainee at Composent. • Key Skills: AI pipeline integration, project architecture, data cleaning. • Achivements: Successfully integrated AI features into legacy software stack."
}
