import subprocess
import os
import shutil

def run_backend():
    print("Starting backend...")
    os.chdir("backend")
    subprocess.Popen(["python", "app.py"])
    os.chdir("..")

def run_frontend():
    print("Starting frontend...")
    os.chdir("frontend")
    npm_path = shutil.which('npm')
    if npm_path:
        subprocess.Popen([npm_path, "run", "start"], shell=True)
    else:
        print("Error: npm not found in the system")
    os.chdir("..")

if __name__ == "__main__":
    run_backend()
    run_frontend()
    print("Application is running. Press Ctrl+C to stop.") 