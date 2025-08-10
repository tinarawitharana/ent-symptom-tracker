from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from config import Config
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user

app = Flask(__name__)
app.config.from_object(Config)

# Session cookie configuration
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_NAME'] = 'symptom_tracker_session'

db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.session_protection = "strong"

# CORS Configuration
CORS(app, 
     origins=[
         "http://localhost:3000", 
         "http://127.0.0.1:3000",
         "https://ent-symptom-tracker.vercel.app"
     ],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True)



# --- User Loader for Flask-Login ---
@login_manager.user_loader
def load_user(user_id):
    try:
        if user_id.startswith('patient_'):
            patient_id = int(user_id.replace('patient_', ''))
            return db.session.get(Patient, patient_id)
        elif user_id.startswith('doctor_'):
            doctor_id = int(user_id.replace('doctor_', ''))
            return db.session.get(Doctor, doctor_id)
        else:
            return db.session.get(Patient, int(user_id))
    except (TypeError, ValueError):
        return None

# SIMPLIFIED Doctor Model - Only basic fields
class Doctor(db.Model, UserMixin):
    __tablename__ = 'doctors'

    doctor_id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Doctor {self.username}>'

    def get_id(self):
        return f"doctor_{self.doctor_id}"

    @property
    def user_type(self):
        return 'doctor'

# SIMPLIFIED Patient Model - Only basic fields
class Patient(db.Model, UserMixin):
    __tablename__ = 'patients'

    patient_id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Simplified relationships - only what actually exists
    logs = relationship('SymptomLog', back_populates='patient')
    conditions = relationship('PatientConditions', back_populates='patient', uselist=False)

    def __repr__(self):
        return f'<Patient {self.username}>'

    def get_id(self):
        return f"patient_{self.patient_id}"

    @property
    def user_type(self):
        return 'patient'

# Patient Conditions - Simple
class PatientConditions(db.Model):
    __tablename__ = 'patient_conditions'

    patient_id = Column(Integer, ForeignKey('patients.patient_id'), primary_key=True)
    has_rhinitis = Column(Boolean, default=False)
    has_vertigo = Column(Boolean, default=False)
    has_tinnitus = Column(Boolean, default=False)

    patient = relationship('Patient', back_populates='conditions')

# Symptom Logs - Simple
class SymptomLog(db.Model):
    __tablename__ = 'symptom_logs'

    log_id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.patient_id'), nullable=False)
    log_timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Rhinitis symptoms
    rhinitis_runny_nose = Column(Integer)
    rhinitis_congestion = Column(Integer)
    rhinitis_sneezing = Column(Integer)
    rhinitis_itchiness = Column(Integer)
    rhinitis_loss_smell = Column(Integer)
    
    # Vertigo symptoms
    vertigo_severity = Column(Integer)
    vertigo_frequency = Column(Integer)
    vertigo_type = Column(Integer)
    vertigo_associated = Column(Integer)
    
    # Tinnitus symptoms
    tinnitus_loudness = Column(Integer)
    tinnitus_type = Column(Integer)
    tinnitus_continuity = Column(Integer)
    tinnitus_impact = Column(Integer)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship('Patient', back_populates='logs')

# ... your existing models (Patient, Doctor, SymptomLog, etc.) ...

# Add this RIGHT AFTER your models and BEFORE your helper functions
def create_tables():
    """Create all database tables"""
    try:
        with app.app_context():
            db.create_all()
            
            # Create default doctor if it doesn't exist
            existing_doctor = Doctor.query.filter_by(username='doctor').first()
            if not existing_doctor:
                hashed_password = generate_password_hash('admin123')
                default_doctor = Doctor(
                    username='doctor',
                    password=hashed_password,
                    first_name='Dr.',
                    last_name='Admin',
                    is_active=True
                )
                db.session.add(default_doctor)
                db.session.commit()
                print("Default doctor created")
            
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error creating tables: {str(e)}")

# ... rest of your helper functions (get_current_user, etc.) ...

# --- Helper Functions ---
def get_current_user():
    if current_user.is_authenticated:
        return current_user
    return None

def get_current_user_id():
    user = get_current_user()
    if user:
        if hasattr(user, 'patient_id'):
            return user.patient_id
        elif hasattr(user, 'doctor_id'):
            return user.doctor_id
    return None

def get_current_user_type():
    user = get_current_user()
    if user:
        return user.user_type
    return None

def get_current_patient_id():
    if current_user.is_authenticated and hasattr(current_user, 'patient_id'):
        return current_user.patient_id
    return None

# --- PATIENT ENDPOINTS ---

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400
            
        username = data.get('username')
        password = data.get('password')
        first_name = data.get('first_name')
        last_name = data.get('last_name')

        if not all([username, password]):
            return jsonify({'message': 'Username and password are required'}), 400

        if Patient.query.filter_by(username=username).first():
            return jsonify({'message': 'User with this username already exists'}), 409

        hashed_password = generate_password_hash(password)
        new_patient = Patient(username=username, password=hashed_password, first_name=first_name, last_name=last_name)
        db.session.add(new_patient)
        db.session.commit()

        login_user(new_patient, remember=True)
        session.permanent = True

        return jsonify({'message': 'Registration successful', 'patient_id': new_patient.patient_id}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Registration error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400
            
        username = data.get('username')
        password = data.get('password')

        if not all([username, password]):
            return jsonify({'message': 'Username and password are required'}), 400

        patient = Patient.query.filter_by(username=username).first()

        if patient and check_password_hash(patient.password, password):
            login_user(patient, remember=True)
            session.permanent = True

            return jsonify({'message': 'Login successful', 'patient_id': patient.patient_id}), 200
        else:
            return jsonify({'message': 'Invalid username or password'}), 401
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    try:
        logout_user()
        return jsonify({'message': 'Logged out successfully'}), 200
    except Exception as e:
        print(f"Logout error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/status', methods=['GET'])
def status():
    try:
        if current_user.is_authenticated:
            user_data = {'isLoggedIn': True}
            if hasattr(current_user, 'patient_id'):
                user_data['patient_id'] = current_user.patient_id
                user_data['user_type'] = 'patient'
            elif hasattr(current_user, 'doctor_id'):
                user_data['doctor_id'] = current_user.doctor_id
                user_data['user_type'] = 'doctor'
            return jsonify(user_data), 200
        else:
            return jsonify({'isLoggedIn': False}), 200
    except Exception as e:
        print(f"Status check error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/conditions', methods=['GET'])
@login_required
def get_conditions():
    try:
        patient_id = get_current_patient_id()
        if patient_id is None:
            return jsonify({'message': 'Not logged in'}), 401
        
        conditions = PatientConditions.query.filter_by(patient_id=patient_id).first()

        if conditions:
            return jsonify({
                'has_rhinitis': conditions.has_rhinitis,
                'has_vertigo': conditions.has_vertigo,
                'has_tinnitus': conditions.has_tinnitus
            }), 200
        else:
            return jsonify({
                'has_rhinitis': False,
                'has_vertigo': False,
                'has_tinnitus': False
            }), 200
    except Exception as e:
        print(f"Get conditions error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/conditions', methods=['POST'])
@login_required
def update_conditions():
    try:
        patient_id = get_current_patient_id()
        if patient_id is None:
            return jsonify({'message': 'Authentication required'}), 401
            
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400
            
        has_rhinitis = data.get('has_rhinitis', False)
        has_vertigo = data.get('has_vertigo', False)
        has_tinnitus = data.get('has_tinnitus', False)

        conditions = PatientConditions.query.filter_by(patient_id=patient_id).first()
        
        if conditions:
            conditions.has_rhinitis = has_rhinitis
            conditions.has_vertigo = has_vertigo
            conditions.has_tinnitus = has_tinnitus
            db.session.commit()
            return jsonify({'message': 'Conditions updated successfully'}), 200
        else:
            patient_conditions = PatientConditions(
                patient_id=patient_id,
                has_rhinitis=has_rhinitis,
                has_vertigo=has_vertigo,
                has_tinnitus=has_tinnitus
            )
            db.session.add(patient_conditions)
            db.session.commit()
            return jsonify({'message': 'Conditions saved successfully'}), 201
            
    except Exception as e:
        db.session.rollback()
        print("Update conditions exception:", str(e))
        return jsonify({'message': 'Database error', 'error': str(e)}), 500

@app.route('/api/symptoms', methods=['POST'])
@login_required
def log_symptoms():
    try:
        patient_id = get_current_patient_id()
        if patient_id is None:
            return jsonify({'message': 'Authentication required'}), 401

        data = request.get_json()
        if not data:
            return jsonify({'message': 'No symptom data provided'}), 400

        new_log = SymptomLog(
            patient_id=patient_id,
            log_timestamp=datetime.utcnow(),
            rhinitis_runny_nose=data.get('rhinitis_runny_nose'),
            rhinitis_congestion=data.get('rhinitis_congestion'),
            rhinitis_sneezing=data.get('rhinitis_sneezing'),
            rhinitis_itchiness=data.get('rhinitis_itchiness'),
            rhinitis_loss_smell=data.get('rhinitis_loss_smell'),
            vertigo_severity=data.get('vertigo_severity'),
            vertigo_frequency=data.get('vertigo_frequency'),
            vertigo_type=data.get('vertigo_type'),
            vertigo_associated=data.get('vertigo_associated'),
            tinnitus_loudness=data.get('tinnitus_loudness'),
            tinnitus_type=data.get('tinnitus_type'),
            tinnitus_continuity=data.get('tinnitus_continuity'),
            tinnitus_impact=data.get('tinnitus_impact')
        )

        db.session.add(new_log)
        db.session.commit()

        return jsonify({'message': 'Symptoms logged successfully', 'log_id': new_log.log_id}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Log symptoms error: {str(e)}")
        return jsonify({'message': 'Database error', 'error': str(e)}), 500
    
# Add this with your other routes (after @app.route('/api/symptoms', methods=['POST']) for example)

@app.route('/api/init-db', methods=['GET'])
def init_database():
    try:
        create_tables()
        return jsonify({'message': 'Database initialized successfully'}), 200
    except Exception as e:
        return jsonify({'message': 'Database initialization failed', 'error': str(e)}), 500

@app.route('/api/debug/session', methods=['GET'])
def debug_session():
    return jsonify({
        'is_authenticated': current_user.is_authenticated,
        'user_id': current_user.get_id() if current_user.is_authenticated else None,
        'session_keys': list(session.keys()),
        'session_permanent': session.permanent,
        'user_info': {
            'username': current_user.username if current_user.is_authenticated else None,
            'patient_id': getattr(current_user, 'patient_id', None) if current_user.is_authenticated else None,
            'doctor_id': getattr(current_user, 'doctor_id', None) if current_user.is_authenticated else None,
            'user_type': current_user.user_type if current_user.is_authenticated else None
        } if current_user.is_authenticated else None
    }), 200

# --- SIMPLIFIED DOCTOR ENDPOINTS ---


# 1. First, add this initialization function to create the default doctor
def initialize_default_doctor():
    """Create default doctor if it doesn't exist"""
    try:
        existing_doctor = Doctor.query.filter_by(username='doctor').first()
        if not existing_doctor:
            hashed_password = generate_password_hash('admin123')
            default_doctor = Doctor(
                username='doctor',
                password=hashed_password,
                first_name='Dr.',
                last_name='Admin',
                is_active=True
            )
            db.session.add(default_doctor)
            db.session.commit()
            print("Default doctor created successfully")
        else:
            print("Default doctor already exists")
    except Exception as e:
        print(f"Error creating default doctor: {str(e)}")
        db.session.rollback()

# 2. Replace your existing doctor login endpoint with this simplified version
@app.route('/api/doctor/login', methods=['POST'])
def doctor_login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400
            
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'message': 'Username and password are required'}), 400

        # Find doctor by username
        doctor = Doctor.query.filter_by(username=username).first()
        
        # If doctor doesn't exist and using default credentials, create it
        if not doctor and username == 'doctor':
            initialize_default_doctor()
            doctor = Doctor.query.filter_by(username='doctor').first()

        if doctor and doctor.is_active and check_password_hash(doctor.password, password):
            login_user(doctor, remember=True)
            session.permanent = True

            return jsonify({
                'message': 'Login successful',
                'doctor_id': doctor.doctor_id,
                'user_type': 'doctor',
                'name': f"{doctor.first_name} {doctor.last_name}",
                'username': doctor.username
            }), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
            
    except Exception as e:
        print(f"Doctor login error: {str(e)}")
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500
    

# 4. Add this endpoint to reset doctor password if needed
@app.route('/api/doctor/reset-password', methods=['POST'])
def reset_doctor_password():
    try:
        data = request.get_json()
        if not data or data.get('admin_key') != 'reset_doctor_2024':
            return jsonify({'message': 'Unauthorized'}), 401
            
        doctor = Doctor.query.filter_by(username='doctor').first()
        if doctor:
            doctor.password = generate_password_hash('admin123')
            db.session.commit()
            return jsonify({'message': 'Password reset successful'}), 200
        else:
            initialize_default_doctor()
            return jsonify({'message': 'Default doctor created'}), 201
            
    except Exception as e:
        return jsonify({'message': 'Reset failed', 'error': str(e)}), 500

# SIMPLIFIED Doctor Dashboard - Shows ALL patients (no relationships)
@app.route('/api/doctor/dashboard', methods=['GET'])
@login_required
def doctor_dashboard():
    try:
        if get_current_user_type() != 'doctor':
            return jsonify({'message': 'Access denied'}), 403
        
        # Get ALL patients (single doctor sees all)
        patients = Patient.query.all()
        
        patients_data = []
        for patient in patients:
            latest_log = SymptomLog.query.filter_by(
                patient_id=patient.patient_id
            ).order_by(SymptomLog.created_at.desc()).first()
            
            conditions = PatientConditions.query.filter_by(
                patient_id=patient.patient_id
            ).first()
            
            total_logs = SymptomLog.query.filter_by(
                patient_id=patient.patient_id
            ).count()
            
            patients_data.append({
                'patient_id': patient.patient_id,
                'name': f"{patient.first_name or ''} {patient.last_name or ''}".strip() or patient.username,
                'username': patient.username,
                'total_logs': total_logs,
                'last_log_date': latest_log.created_at.isoformat() if latest_log else None,
                'conditions': {
                    'rhinitis': conditions.has_rhinitis if conditions else False,
                    'vertigo': conditions.has_vertigo if conditions else False,
                    'tinnitus': conditions.has_tinnitus if conditions else False
                },
                'assigned_date': patient.created_at.isoformat()  # Use patient creation date
            })
        
        return jsonify({
            'patients': patients_data,
            'total_patients': len(patients_data)
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Dashboard error', 'error': str(e)}), 500

# SIMPLIFIED Patient Analytics (no relationship checks)
@app.route('/api/doctor/patient/<int:patient_id>/analytics', methods=['GET'])
@login_required
def patient_analytics(patient_id):
    try:
        if get_current_user_type() != 'doctor':
            return jsonify({'message': 'Access denied'}), 403
        
        patient = Patient.query.get(patient_id)
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
            
        conditions = PatientConditions.query.filter_by(patient_id=patient_id).first()
        
        logs = SymptomLog.query.filter_by(
            patient_id=patient_id
        ).order_by(SymptomLog.created_at.asc()).all()
        
        chart_data = []
        for log in logs:
            rhinitis_values = []
            if conditions and conditions.has_rhinitis:
                rhinitis_values = [v for v in [
                    log.rhinitis_runny_nose, log.rhinitis_congestion,
                    log.rhinitis_sneezing, log.rhinitis_itchiness,
                    log.rhinitis_loss_smell
                ] if v is not None]
            
            tinnitus_values = []
            if conditions and conditions.has_tinnitus:
                tinnitus_values = [v for v in [
                    log.tinnitus_loudness, log.tinnitus_impact
                ] if v is not None]
            
            all_values = []
            if conditions:
                if conditions.has_rhinitis:
                    all_values.extend(rhinitis_values)
                if conditions.has_vertigo and log.vertigo_severity:
                    all_values.append(log.vertigo_severity)
                if conditions.has_tinnitus:
                    all_values.extend(tinnitus_values)
            
            chart_data.append({
                'date': log.created_at.strftime('%Y-%m-%d'),
                'timestamp': log.created_at.isoformat(),
                'rhinitis_avg': round(sum(rhinitis_values) / len(rhinitis_values), 2) if rhinitis_values else None,
                'vertigo_severity': log.vertigo_severity if conditions and conditions.has_vertigo else None,
                'tinnitus_avg': round(sum(tinnitus_values) / len(tinnitus_values), 2) if tinnitus_values else None,
                'overall_severity': round(sum(all_values) / len(all_values), 2) if all_values else 0
            })
        
        return jsonify({
            'patient': {
                'id': patient.patient_id,
                'name': f"{patient.first_name or ''} {patient.last_name or ''}".strip() or patient.username,
                'username': patient.username,
                'conditions': {
                    'rhinitis': conditions.has_rhinitis if conditions else False,
                    'vertigo': conditions.has_vertigo if conditions else False,
                    'tinnitus': conditions.has_tinnitus if conditions else False
                }
            },
            'chart_data': chart_data,
            'total_logs': len(logs),
            'date_range': {
                'start': logs[0].created_at.isoformat() if logs else None,
                'end': logs[-1].created_at.isoformat() if logs else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Analytics error', 'error': str(e)}), 500

# SIMPLIFIED Patient Logs
@app.route('/api/doctor/patient/<int:patient_id>/logs', methods=['GET'])
@login_required
def patient_logs(patient_id):
    try:
        if get_current_user_type() != 'doctor':
            return jsonify({'message': 'Access denied'}), 403
        
        patient = Patient.query.get(patient_id)
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
            
        conditions = PatientConditions.query.filter_by(patient_id=patient_id).first()
        
        logs = SymptomLog.query.filter_by(
            patient_id=patient_id
        ).order_by(SymptomLog.created_at.desc()).all()
        
        logs_data = []
        for log in logs:
            logs_data.append({
                'log_id': log.log_id,
                'log_timestamp': log.log_timestamp.isoformat(),
                'rhinitis_runny_nose': log.rhinitis_runny_nose,
                'rhinitis_congestion': log.rhinitis_congestion,
                'rhinitis_sneezing': log.rhinitis_sneezing,
                'rhinitis_itchiness': log.rhinitis_itchiness,
                'rhinitis_loss_smell': log.rhinitis_loss_smell,
                'vertigo_severity': log.vertigo_severity,
                'vertigo_frequency': log.vertigo_frequency,
                'vertigo_type': log.vertigo_type,
                'vertigo_associated': log.vertigo_associated,
                'tinnitus_loudness': log.tinnitus_loudness,
                'tinnitus_type': log.tinnitus_type,
                'tinnitus_continuity': log.tinnitus_continuity,
                'tinnitus_impact': log.tinnitus_impact
            })
        
        return jsonify({
            'patient': {
                'id': patient.patient_id,
                'name': f"{patient.first_name or ''} {patient.last_name or ''}".strip() or patient.username,
                'username': patient.username,
                'conditions': {
                    'rhinitis': conditions.has_rhinitis if conditions else False,
                    'vertigo': conditions.has_vertigo if conditions else False,
                    'tinnitus': conditions.has_tinnitus if conditions else False
                }
            },
            'logs': logs_data,
            'total_logs': len(logs_data)
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Logs error', 'error': str(e)}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    try:
        db.session.rollback()
    except:
        pass
    print(f"Unhandled exception: {str(e)}")
    response = jsonify({'message': 'Internal server error', 'error': str(e)})
    response.status_code = 500
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

if __name__ == '__main__':
    create_tables()  # This calls our new function
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)