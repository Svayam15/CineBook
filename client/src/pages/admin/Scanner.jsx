import AdminLayout from "../../components/admin/AdminLayout";
import ScannerCore from "../../components/common/ScannerCore";

const Scanner = () => (
  <AdminLayout>
    <ScannerCore isAdmin={true} />
  </AdminLayout>
);

export default Scanner;