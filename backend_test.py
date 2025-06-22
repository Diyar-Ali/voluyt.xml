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

def test_dashboard_stats_serialization():
    """Focused test for the dashboard stats endpoint to verify ObjectId serialization fix"""
    tester = CRMAPITester()
    
    print("\n🔍 FOCUSED TEST: Dashboard Stats Serialization")
    print("Testing if the ObjectId serialization issue has been fixed...")
    
    success, response = tester.test_get_dashboard_stats()
    
    if success and response:
        # Verify the structure of the response
        if 'totals' in response:
            print("✅ Dashboard stats contains 'totals' section")
            
            # Check if totals contains actual numbers instead of zeros
            totals = response['totals']
            if totals.get('contacts', 0) > 0 or totals.get('leads', 0) > 0 or totals.get('projects', 0) > 0:
                print("✅ Dashboard stats shows actual data (non-zero values)")
            else:
                print("⚠️ Dashboard stats shows all zeros - possible issue")
                
        else:
            print("❌ Dashboard stats missing 'totals' section")
            
        # Check for recent activity
        if 'recent_activity' in response:
            print("✅ Dashboard stats contains 'recent_activity' section")
            if response['recent_activity']:
                print(f"✅ Recent activity contains {len(response['recent_activity'])} items")
            else:
                print("⚠️ Recent activity is empty")
        else:
            print("❌ Dashboard stats missing 'recent_activity' section")
            
        # Check for insights
        if 'insights' in response:
            print("✅ Dashboard stats contains 'insights' section")
        else:
            print("❌ Dashboard stats missing 'insights' section")
            
        return success
    else:
        print("❌ Failed to get dashboard stats")
        return False

def main():
    tester = CRMAPITester()
    
    # Run the focused test for dashboard stats serialization
    dashboard_test_success = test_dashboard_stats_serialization()
    
    if dashboard_test_success:
        print("\n✅ Dashboard stats endpoint is working correctly")
    else:
        print("\n❌ Dashboard stats endpoint still has issues")
    
    # Run a few basic tests to verify other functionality
    print("\n🔍 Running basic verification tests...")
    
    # Test contacts API
    success, contacts_response = tester.test_get_contacts()
    
    # Test leads API
    success_leads, leads_response = tester.test_get_leads()
    
    # Test insights
    success_insights, insights_response = tester.test_get_insights()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    main()