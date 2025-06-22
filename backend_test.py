import requests
import json
import csv
import io
import uuid
from datetime import datetime

class CRMAPITester:
    def __init__(self, base_url="https://a7cd6748-5864-4535-aaca-fabba9da1ddf.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_data = {}

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.headers.get('Content-Type') and 'application/json' in response.headers.get('Content-Type'):
                    return success, response.json()
                return success, response
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, None

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, None

    def test_get_contacts(self):
        """Test getting all contacts"""
        return self.run_test(
            "Get Contacts",
            "GET",
            "contacts",
            200
        )

    def test_create_contact(self, contact_data):
        """Test creating a contact"""
        success, response = self.run_test(
            "Create Contact",
            "POST",
            "contacts",
            200,
            data=contact_data
        )
        if success:
            self.test_data['contact_id'] = response['id']
            return response
        return None

    def test_get_contact(self, contact_id):
        """Test getting a specific contact"""
        return self.run_test(
            "Get Contact",
            "GET",
            f"contacts/{contact_id}",
            200
        )

    def test_create_lead(self, lead_data):
        """Test creating a lead"""
        success, response = self.run_test(
            "Create Lead",
            "POST",
            "leads",
            200,
            data=lead_data
        )
        if success:
            self.test_data['lead_id'] = response['id']
            return response
        return None

    def test_get_leads(self):
        """Test getting all leads"""
        return self.run_test(
            "Get Leads",
            "GET",
            "leads",
            200
        )

    def test_create_interaction(self, interaction_data):
        """Test creating an interaction"""
        success, response = self.run_test(
            "Create Interaction",
            "POST",
            "interactions",
            200,
            data=interaction_data
        )
        if success:
            self.test_data['interaction_id'] = response['id']
            return response
        return None

    def test_get_interactions(self, contact_id=None):
        """Test getting interactions"""
        endpoint = "interactions"
        if contact_id:
            endpoint += f"?contact_id={contact_id}"
        
        return self.run_test(
            "Get Interactions",
            "GET",
            endpoint,
            200
        )

    def test_get_insights(self):
        """Test getting insights"""
        return self.run_test(
            "Get Insights",
            "GET",
            "insights",
            200
        )

    def test_get_dashboard_stats(self):
        """Test getting dashboard stats"""
        return self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )

    def test_csv_import(self, csv_data):
        """Test CSV import functionality"""
        # Create a CSV file in memory
        csv_file = io.StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(['name', 'email', 'phone', 'company', 'industry', 'position', 'assigned_to'])
        for row in csv_data:
            writer.writerow(row)
        
        csv_file.seek(0)
        csv_content = csv_file.getvalue().encode('utf-8')
        
        files = {'file': ('contacts.csv', csv_content, 'text/csv')}
        
        return self.run_test(
            "Import CSV",
            "POST",
            "import/contacts",
            200,
            files=files
        )

    def test_csv_export(self):
        """Test CSV export functionality"""
        success, response = self.run_test(
            "Export CSV",
            "GET",
            "export/contacts",
            200
        )
        
        if success:
            # Check if the response is a CSV file
            content_type = response.headers.get('Content-Type', '')
            content_disposition = response.headers.get('Content-Disposition', '')
            
            if 'text/csv' in content_type and 'attachment; filename=contacts.csv' in content_disposition:
                print("✅ CSV export successful - correct headers")
                return True
            else:
                print(f"❌ CSV export failed - wrong headers: {content_type}, {content_disposition}")
                return False
        
        return False

def main():
    tester = CRMAPITester()
    
    # Test dashboard stats
    tester.test_get_dashboard_stats()
    
    # Test contacts API
    success, contacts_response = tester.test_get_contacts()
    
    # Create a test contact
    test_contact = {
        "name": f"Test Contact {uuid.uuid4().hex[:8]}",
        "email": f"test{uuid.uuid4().hex[:8]}@example.com",
        "phone": "555-123-4567",
        "company": "Test Company",
        "industry": "Technology",
        "position": "Developer",
        "assigned_to": "Test User"
    }
    contact = tester.test_create_contact(test_contact)
    
    if contact:
        # Test getting a specific contact
        tester.test_get_contact(contact['id'])
        
        # Test creating a lead
        test_lead = {
            "contact_id": contact['id'],
            "title": "Test Lead",
            "description": "This is a test lead",
            "status": "prospect",
            "value": 10000,
            "probability": 50,
            "source": "Website",
            "assigned_to": "Test User"
        }
        lead = tester.test_create_lead(test_lead)
        
        # Test getting leads
        tester.test_get_leads()
        
        # Test creating an interaction
        test_interaction = {
            "contact_id": contact['id'],
            "lead_id": lead['id'] if lead else None,
            "type": "call",
            "title": "Test Call",
            "description": "This is a test call",
            "employee": "Test User",
            "follow_up_required": True,
            "follow_up_date": (datetime.utcnow().isoformat())
        }
        interaction = tester.test_create_interaction(test_interaction)
        
        # Test getting interactions
        tester.test_get_interactions()
        tester.test_get_interactions(contact['id'])
    
    # Test insights
    tester.test_get_insights()
    
    # Test CSV import/export
    csv_data = [
        [f"CSV Contact 1 {uuid.uuid4().hex[:8]}", "csv1@example.com", "555-111-2222", "CSV Company 1", "Finance", "Manager", "User 1"],
        [f"CSV Contact 2 {uuid.uuid4().hex[:8]}", "csv2@example.com", "555-333-4444", "CSV Company 2", "Healthcare", "Director", "User 2"]
    ]
    tester.test_csv_import(csv_data)
    tester.test_csv_export()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    main()