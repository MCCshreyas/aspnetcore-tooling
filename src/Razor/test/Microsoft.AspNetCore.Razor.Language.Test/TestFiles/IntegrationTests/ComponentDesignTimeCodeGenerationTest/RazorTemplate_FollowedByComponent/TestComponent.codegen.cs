// <auto-generated/>
#pragma warning disable 1591
namespace Test
{
    #line hidden
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Components;
    public class TestComponent : Microsoft.AspNetCore.Components.ComponentBase
    {
        #pragma warning disable 219
        private void __RazorDirectiveTokenHelpers__() {
        ((System.Action)(() => {
#line 1 "x:\dir\subdir\Test\TestComponent.cshtml"
global::System.Object __typeHelper = "*, TestAssembly";

#line default
#line hidden
        }
        ))();
        }
        #pragma warning restore 219
        #pragma warning disable 0414
        private static System.Object __o = null;
        #pragma warning restore 0414
        #pragma warning disable 1998
        protected override void BuildRenderTree(Microsoft.AspNetCore.Components.RenderTree.RenderTreeBuilder builder)
        {
            base.BuildRenderTree(builder);
#line 2 "x:\dir\subdir\Test\TestComponent.cshtml"
  
    RenderFragment<Person> p = (person) => 

#line default
#line hidden
            (builder2) => {
                __o = Microsoft.AspNetCore.Components.RuntimeHelpers.TypeCheck<System.String>(
#line 3 "x:\dir\subdir\Test\TestComponent.cshtml"
                                                                     person.Name

#line default
#line hidden
                );
                builder2.AddAttribute(-1, "ChildContent", (Microsoft.AspNetCore.Components.RenderFragment)((builder3) => {
                }
                ));
            }
#line 3 "x:\dir\subdir\Test\TestComponent.cshtml"
                                                                                         ;

#line default
#line hidden
            builder.AddAttribute(-1, "ChildContent", (Microsoft.AspNetCore.Components.RenderFragment)((builder2) => {
#line 6 "x:\dir\subdir\Test\TestComponent.cshtml"
__o = "hello, world!";

#line default
#line hidden
            }
            ));
        }
        #pragma warning restore 1998
#line 9 "x:\dir\subdir\Test\TestComponent.cshtml"
            
    class Person
    {
        public string Name { get; set; }
    }

#line default
#line hidden
    }
}
#pragma warning restore 1591
