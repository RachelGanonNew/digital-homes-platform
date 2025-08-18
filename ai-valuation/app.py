from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import requests
import json
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

class PropertyValuationAI:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_columns = [
            'square_feet', 'bedrooms', 'bathrooms', 'lot_size',
            'year_built', 'neighborhood_score', 'walkability_score',
            'school_rating', 'crime_rate', 'median_income',
            'price_per_sqft_area', 'days_on_market_avg', 'property_tax_rate'
        ]
        
    def generate_synthetic_data(self, n_samples=1000):
        """Generate synthetic training data for demonstration"""
        np.random.seed(42)
        data = {
            'square_feet': np.random.normal(2000, 500, n_samples),
            'bedrooms': np.random.randint(1, 6, n_samples),
            'bathrooms': np.random.randint(1, 4, n_samples),
            'lot_size': np.random.normal(8000, 2000, n_samples),
            'year_built': np.random.randint(1950, 2024, n_samples),
            'neighborhood_score': np.random.uniform(1, 10, n_samples),
            'walkability_score': np.random.uniform(0, 100, n_samples),
            'school_rating': np.random.uniform(1, 10, n_samples),
            'crime_rate': np.random.uniform(0, 50, n_samples),
            'median_income': np.random.normal(60000, 20000, n_samples),
            'price_per_sqft_area': np.random.normal(150, 50, n_samples),
            'days_on_market_avg': np.random.normal(30, 15, n_samples),
            'property_tax_rate': np.random.uniform(0.5, 3.0, n_samples)
        }
        
        df = pd.DataFrame(data)
        
        # Generate realistic prices based on features
        df['price'] = (
            df['square_feet'] * 100 +
            df['bedrooms'] * 15000 +
            df['bathrooms'] * 10000 +
            df['lot_size'] * 5 +
            (2024 - df['year_built']) * -500 +
            df['neighborhood_score'] * 20000 +
            df['school_rating'] * 15000 +
            (10 - df['crime_rate']) * 2000 +
            df['median_income'] * 2 +
            np.random.normal(0, 50000, n_samples)
        )
        
        # Ensure positive prices
        df['price'] = np.maximum(df['price'], 50000)
        
        return df
    
    def train_model(self):
        """Train the AI model with synthetic data"""
        print("Training AI property valuation model...")
        df = self.generate_synthetic_data()
        
        X = df[self.feature_columns]
        y = df['price']
        
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.is_trained = True
        
        print(f"Model trained with R² score: {self.model.score(X_scaled, y):.3f}")
        
    def predict_property_value(self, property_data):
        """Predict property value using AI model"""
        if not self.is_trained:
            self.train_model()
            
        # Create feature vector
        features = []
        for col in self.feature_columns:
            features.append(property_data.get(col, 0))
        
        features_scaled = self.scaler.transform([features])
        predicted_price = self.model.predict(features_scaled)[0]
        
        # Calculate confidence intervals
        predictions = []
        for estimator in self.model.estimators_:
            pred = estimator.predict(features_scaled)[0]
            predictions.append(pred)
        
        std_dev = np.std(predictions)
        confidence_lower = predicted_price - 1.96 * std_dev
        confidence_upper = predicted_price + 1.96 * std_dev
        
        return {
            'predicted_value': round(predicted_price, 2),
            'confidence_interval': {
                'lower': round(confidence_lower, 2),
                'upper': round(confidence_upper, 2)
            },
            'confidence_score': min(100, max(0, 100 - (std_dev / predicted_price * 100)))
        }
    
    def get_market_insights(self, property_data):
        """Generate market insights and investment potential"""
        location = property_data.get('address', 'Unknown Location')
        
        # Simulate market analysis
        market_trends = {
            'price_appreciation_1yr': np.random.uniform(-5, 15),
            'price_appreciation_5yr': np.random.uniform(10, 50),
            'rental_yield': np.random.uniform(3, 8),
            'market_liquidity': np.random.uniform(60, 95),
            'investment_grade': 'A' if np.random.random() > 0.7 else 'B' if np.random.random() > 0.4 else 'C'
        }
        
        return {
            'location': location,
            'market_trends': market_trends,
            'investment_recommendation': self._generate_recommendation(market_trends),
            'risk_factors': self._identify_risk_factors(property_data),
            'comparable_properties': self._find_comparables(property_data)
        }
    
    def _generate_recommendation(self, trends):
        """Generate investment recommendation"""
        score = (
            trends['price_appreciation_5yr'] * 0.3 +
            trends['rental_yield'] * 0.4 +
            trends['market_liquidity'] * 0.3
        )
        
        if score > 70:
            return "Strong Buy - Excellent investment potential"
        elif score > 50:
            return "Buy - Good investment opportunity"
        elif score > 30:
            return "Hold - Moderate investment potential"
        else:
            return "Caution - Consider other opportunities"
    
    def _identify_risk_factors(self, property_data):
        """Identify potential risk factors"""
        risks = []
        
        if property_data.get('year_built', 2000) < 1980:
            risks.append("Older property may require significant maintenance")
        
        if property_data.get('crime_rate', 0) > 30:
            risks.append("High crime rate in the area")
        
        if property_data.get('days_on_market_avg', 30) > 60:
            risks.append("Properties in area take longer to sell")
        
        return risks if risks else ["Low risk investment"]
    
    def _find_comparables(self, property_data):
        """Find comparable properties (simulated)"""
        base_price = property_data.get('estimated_value', 300000)
        
        comparables = []
        for i in range(3):
            comp_price = base_price * np.random.uniform(0.85, 1.15)
            comparables.append({
                'address': f"Comparable Property {i+1}",
                'price': round(comp_price, 2),
                'square_feet': property_data.get('square_feet', 2000) * np.random.uniform(0.9, 1.1),
                'bedrooms': property_data.get('bedrooms', 3),
                'bathrooms': property_data.get('bathrooms', 2)
            })
        
        return comparables

# Initialize AI model
ai_valuator = PropertyValuationAI()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'model_trained': ai_valuator.is_trained})

@app.route('/valuate', methods=['POST'])
def valuate_property():
    try:
        property_data = request.json
        
        # Validate required fields
        required_fields = ['square_feet', 'bedrooms', 'bathrooms']
        for field in required_fields:
            if field not in property_data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get AI valuation
        valuation = ai_valuator.predict_property_value(property_data)
        
        # Get market insights
        insights = ai_valuator.get_market_insights(property_data)
        
        response = {
            'valuation': valuation,
            'market_insights': insights,
            'timestamp': datetime.now().isoformat(),
            'property_id': property_data.get('id', 'unknown')
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/train', methods=['POST'])
def train_model():
    try:
        ai_valuator.train_model()
        return jsonify({'message': 'Model trained successfully', 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/market-analysis', methods=['POST'])
def market_analysis():
    try:
        location_data = request.json
        
        # Simulate comprehensive market analysis
        analysis = {
            'location': location_data.get('location', 'Unknown'),
            'market_overview': {
                'median_price': np.random.uniform(200000, 800000),
                'price_per_sqft': np.random.uniform(100, 300),
                'inventory_levels': np.random.uniform(1, 6),
                'absorption_rate': np.random.uniform(0.5, 3.0)
            },
            'demographics': {
                'population_growth': np.random.uniform(-2, 8),
                'median_age': np.random.uniform(25, 55),
                'median_income': np.random.uniform(40000, 120000),
                'employment_rate': np.random.uniform(85, 98)
            },
            'infrastructure': {
                'walkability_score': np.random.uniform(20, 95),
                'transit_score': np.random.uniform(10, 90),
                'school_rating': np.random.uniform(3, 10),
                'hospital_proximity': np.random.uniform(1, 20)
            }
        }
        
        return jsonify(analysis)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Digital Homes AI Valuation Service...")
    print("Training initial model...")
    ai_valuator.train_model()
    print("AI Service ready!")
    app.run(debug=True, port=5001)
