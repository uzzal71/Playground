package main

import "fmt"

// implemeatation golang interfaces
type Payment interface {
	Pay(amount float64) string
	Refund(amount float64) string	
}

type CreditCard struct{}

func (c *CreditCard) Pay(amount float64) string {
	return "Paid " + formatAmount(amount) + " using Credit Card"
}

func (c *CreditCard) Refund(amount float64) string {
	return "Refunded " + formatAmount(amount) + " to Credit Card"
}

func formatAmount(amount float64) string {
	return fmt.Sprintf("%.2f", amount)
}	

func main() {
	var payment Payment

	payment = &CreditCard{}
	println(payment.Pay(100.0))	// Output: Paid 100.00 using Credit Card
	println(payment.Refund(50.0))  // Output: Refunded 50.00 to Credit Card
}