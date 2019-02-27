function toggleAccType(){
	var accType = document.querySelector('input[name = accType]:checked').value;
	document.getElementById('customerRegContainer').style.display = (value == "customer") ? 'block' : 'none';
	document.getElementById('vendorRegContainer').style.display = (value == "vendor") ? 'block' : 'none';
}
